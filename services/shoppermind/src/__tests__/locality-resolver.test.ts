import { describe, it, expect } from 'vitest';
import { resolveLocality } from '../engine/locality/locality-resolver.js';
import type { MarketConfig } from '../engine/registry/market-schema.js';
import type { RawSignalInput } from '../engine/types.js';

const baseMarket: MarketConfig = {
  id: 'tampere-fi',
  country: 'FI',
  region: 'pirkanmaa-fi',
  displayName: 'Tampere',
  industryFocus: 'property-industry',
  geoAnchorLat: 61.4978,
  geoAnchorLon: 23.7609,
  footTrafficSubs: ['CITY:tampere-fi', 'REGION:pirkanmaa-fi', 'COUNTRY:FI'],
  culturalSubs: ['COUNTRY:FI', 'GLOBAL'],
  footTrafficAxisWeight: 0.4,
  culturalAxisWeight: 0.6,
  profile: {
    displayName: 'Tampere',
    industryFocus: 'property-industry',
    language: 'fi',
    persona: '',
    categoryKeywords: {},
    relevanceKeywords: [],
    weightPriors: {},
    seedSources: [],
  },
  policy: {
    version: 1,
    thresholds: { 'TREND:composite:COUNTRY': { publish: 0.6, review: 0.4, reject: 0.2 } },
    lifecycleModifiers: { UPCOMING: -0.1, ACTIVE: 0, CONCLUDED: 0.2 },
  },
  active: true,
};

function signal(title: string, summary = '', country = 'FI'): RawSignalInput {
  return {
    externalId: title.slice(0, 32),
    title,
    summary,
    country,
    language: 'fi',
    publishedAt: new Date('2026-04-01T00:00:00Z'),
  };
}

describe('resolveLocality', () => {
  it('falls back to signal country at COUNTRY scope when no place is mentioned', () => {
    const r = resolveLocality(signal('Consumer spending ticks up'), baseMarket);
    expect(r.footTraffic.scope).toBe('COUNTRY');
    expect(r.footTraffic.localityId).toBe('FI');
    expect(r.cultural.scope).toBe('COUNTRY');
    expect(r.cultural.localityId).toBe('FI');
  });

  it('resolves city mentions to CITY scope on foot-traffic', () => {
    const r = resolveLocality(signal('Tampere retail footfall breaks records'), baseMarket);
    expect(r.footTraffic).toMatchObject({ scope: 'CITY', localityId: 'tampere-fi' });
  });

  it('applies culturalLiftDefault: Asuntomessut Lempäälä → CITY foot-traffic, COUNTRY:FI cultural', () => {
    const r = resolveLocality(
      signal('Asuntomessut Lempäälä 2026 opens Friday', 'housing fair'),
      baseMarket,
    );
    expect(r.footTraffic).toMatchObject({ scope: 'CITY', localityId: 'lempaala-fi' });
    expect(r.cultural).toMatchObject({ scope: 'COUNTRY', localityId: 'FI' });
  });

  it('global cue lifts cultural to GLOBAL regardless of place hit', () => {
    const r = resolveLocality(
      signal('Worldwide shift toward remote-work offices', 'global trend'),
      baseMarket,
    );
    expect(r.cultural).toMatchObject({ scope: 'GLOBAL', localityId: 'GLOBAL' });
  });
});
