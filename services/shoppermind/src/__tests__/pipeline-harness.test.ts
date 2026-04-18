import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

import { MarketSchema, type MarketConfig } from '../engine/registry/market-schema.js';
import { runPipelineForMarket } from '../engine/testing/pipeline-harness.js';
import { generateSignals } from '../engine/testing/synthetic-generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(__dirname, '../engine/registry/seed-markets.json');
const rawSeed = JSON.parse(readFileSync(seedPath, 'utf-8')) as unknown[];
const markets: Record<string, MarketConfig> = {};
for (const row of rawSeed) {
  const parsed = MarketSchema.parse(row);
  markets[parsed.id] = parsed;
}

const now = new Date('2026-04-20T12:00:00Z');
const scenarioStart = new Date(now.getTime() - 6 * 86_400_000);

describe('microtrend-local-event: Asuntomessut Lempäälä visibility by market', () => {
  const signals = generateSignals(
    {
      shape: 'EVENT_BURST',
      label: 'Asuntomessut Lempäälä 2026',
      keywords: ['housing', 'design', 'asuntomessut'],
      country: 'FI',
      language: 'fi',
      localeText: 'Lempäälä housing fair',
      peakVolume: 8,
      windowDays: 7,
      peakDay: 5,
    },
    scenarioStart,
  );

  it('resolves foot-traffic to CITY:lempaala-fi and cultural to COUNTRY:FI', () => {
    const r = runPipelineForMarket(markets['tampere-fi'], signals, now);
    expect(r.phenomena).toHaveLength(1);
    expect(r.phenomena[0].footTraffic).toMatchObject({ scope: 'CITY', localityId: 'lempaala-fi' });
    expect(r.phenomena[0].cultural).toMatchObject({ scope: 'COUNTRY', localityId: 'FI' });
  });

  it('tampere-fi receives appreciable foot-traffic weight (hierarchy + distance)', () => {
    const r = runPipelineForMarket(markets['tampere-fi'], signals, now);
    expect(r.phenomena[0].footTrafficProximity).toBeGreaterThan(0.5);
  });

  it('helsinki-fi gets low foot-traffic weight but full cultural reach', () => {
    const r = runPipelineForMarket(markets['helsinki-fi'], signals, now);
    const ph = r.phenomena[0];
    expect(ph.footTrafficProximity).toBeLessThan(0.5);
    expect(ph.culturalProximity).toBeGreaterThanOrEqual(0.9);
  });

  it('dubai-ae does not subscribe FI scopes → zero weight on both axes', () => {
    const r = runPipelineForMarket(markets['dubai-ae'], signals, now);
    const ph = r.phenomena[0];
    expect(ph.footTrafficProximity).toBe(0);
    expect(ph.culturalProximity).toBe(0);
    expect(ph.decision).toBe('REJECT');
  });
});

describe('cross-market isolation', () => {
  const berlinSignals = generateSignals(
    {
      shape: 'TREND_ARC',
      label: 'Berlin luxury retail shift',
      keywords: ['berlin', 'retail', 'luxury'],
      country: 'DE',
      language: 'de',
      localeText: 'Berlin',
      peakVolume: 6,
      windowDays: 7,
    },
    scenarioStart,
  );
  it('does not appear in helsinki-fi view', () => {
    const r = runPipelineForMarket(markets['helsinki-fi'], berlinSignals, now);
    const berlin = r.phenomena.find((p) => p.label.includes('berlin'));
    if (berlin) {
      expect(berlin.decision).toBe('REJECT');
      expect(berlin.culturalProximity).toBe(0);
    }
  });
  it('publishes for berlin-de with the same signals', () => {
    const r = runPipelineForMarket(markets['berlin-de'], berlinSignals, now);
    const berlin = r.phenomena.find((p) => p.label.includes('berlin'));
    expect(berlin).toBeDefined();
    expect(berlin?.culturalProximity).toBeGreaterThanOrEqual(0.9);
  });
});

describe('global-trend-propagation', () => {
  const signals = generateSignals(
    {
      shape: 'TREND_ARC',
      label: 'Worldwide shift toward remote-work offices',
      keywords: ['remote', 'work', 'office'],
      country: 'US',
      language: 'en',
      localeText: 'global trend',
      peakVolume: 10,
      windowDays: 7,
    },
    scenarioStart,
  );
  it('reaches all markets with GLOBAL cultural subscription', () => {
    for (const id of ['tampere-fi', 'lempaala-fi', 'berlin-de', 'tokyo-jp', 'newyork-us']) {
      const r = runPipelineForMarket(markets[id], signals, now);
      const p = r.phenomena[0];
      expect(p.cultural.scope).toBe('GLOBAL');
      expect(p.culturalProximity).toBe(1);
    }
  });
  it('does not reach helsinki-fi (no GLOBAL sub) on cultural axis', () => {
    const r = runPipelineForMarket(markets['helsinki-fi'], signals, now);
    const p = r.phenomena[0];
    expect(p.cultural.scope).toBe('GLOBAL');
    expect(p.culturalProximity).toBe(0);
  });
});

describe('event-trend-linkage', () => {
  const housingTrend = generateSignals(
    {
      shape: 'TREND_ARC',
      label: 'Finnish passive-house design shift',
      keywords: ['housing', 'design', 'passive-house', 'sustainability'],
      country: 'FI',
      language: 'fi',
      peakVolume: 5,
      windowDays: 7,
    },
    scenarioStart,
  );
  const housingEvent = generateSignals(
    {
      shape: 'EVENT_BURST',
      label: 'Asuntomessut Lempäälä 2026',
      keywords: ['housing', 'design', 'passive-house'],
      country: 'FI',
      language: 'fi',
      localeText: 'Lempäälä',
      peakVolume: 6,
      windowDays: 7,
      peakDay: 3,
    },
    scenarioStart,
  );
  it('links the event to the trend via MANIFESTATION_OF', () => {
    const r = runPipelineForMarket(
      markets['tampere-fi'],
      [...housingTrend, ...housingEvent],
      now,
    );
    const manifest = r.links.find((l) => l.linkType === 'MANIFESTATION_OF');
    expect(manifest).toBeDefined();
  });
});
