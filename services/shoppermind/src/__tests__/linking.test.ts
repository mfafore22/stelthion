import { describe, it, expect } from 'vitest';
import { inferLinks, type LinkablePhenomenon } from '../engine/linking/link-inferrer.js';
import { applyLinkBoost } from '../engine/linking/link-boost.js';

const now = new Date('2026-04-01T00:00:00Z');

function p(
  id: string,
  type: LinkablePhenomenon['type'],
  keywords: string[],
  culturalLocality = 'FI',
  overrides: Partial<LinkablePhenomenon> = {},
): LinkablePhenomenon {
  return {
    id,
    label: id,
    keywords,
    type,
    culturalScope: 'COUNTRY',
    culturalLocality,
    ...overrides,
  };
}

describe('inferLinks', () => {
  it('EVENT becomes MANIFESTATION_OF overlapping TREND in same scope', () => {
    const target = p('asuntomessut-2026', 'EVENT', ['housing', 'passive-house', 'design']);
    const trend = p('passive-house-trend', 'TREND', ['housing', 'passive-house', 'sustainability']);
    const links = inferLinks(target, [trend], now);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      fromPhenomenonId: 'asuntomessut-2026',
      toPhenomenonId: 'passive-house-trend',
      linkType: 'MANIFESTATION_OF',
    });
  });

  it('INCIDENT ACCELERATES an overlapping TREND', () => {
    const incident = p('transit-strike-fi', 'INCIDENT', ['transit', 'strike', 'commute']);
    const trend = p('remote-commute-shift', 'TREND', ['transit', 'commute', 'remote']);
    const links = inferLinks(incident, [trend], now);
    expect(links[0].linkType).toBe('ACCELERATES');
  });

  it('CAMPAIGN PRECEDES next instance when prior ended before target begins', () => {
    const prior = p('black-friday-2025', 'CAMPAIGN', ['black friday', 'sale', 'retail'], 'FI', {
      eventStart: new Date('2025-11-28'),
      eventEnd: new Date('2025-11-30'),
    });
    const target = p('black-friday-2026', 'CAMPAIGN', ['black friday', 'sale', 'retail'], 'FI', {
      eventStart: new Date('2026-11-27'),
      eventEnd: new Date('2026-11-29'),
    });
    const links = inferLinks(target, [prior], now);
    const precedes = links.find((l) => l.linkType === 'PRECEDES');
    expect(precedes).toBeDefined();
    expect(precedes?.fromPhenomenonId).toBe('black-friday-2025');
    expect(precedes?.toPhenomenonId).toBe('black-friday-2026');
  });

  it('skips candidates outside the cultural scope', () => {
    const target = p('housing-fair-de', 'EVENT', ['housing', 'design'], 'DE');
    const trendFi = p('passive-house-fi', 'TREND', ['housing', 'design'], 'FI');
    const links = inferLinks(target, [trendFi], now);
    expect(links).toHaveLength(0);
  });
});

describe('applyLinkBoost', () => {
  it('caps boost at 20% of the trend velocity', () => {
    const result = applyLinkBoost(
      { id: 'trend', velocity: 10 },
      [
        { fromPhenomenonId: 'e1', toPhenomenonId: 'trend', linkType: 'CONTRIBUTES_TO', weight: 0.9 },
      ],
      [{ id: 'e1', velocity: 100, lifecycleState: 'ACTIVE' }],
    );
    expect(result.boost).toBeCloseTo(2.0, 6);
  });

  it('does not count inactive contributors', () => {
    const result = applyLinkBoost(
      { id: 'trend', velocity: 10 },
      [
        { fromPhenomenonId: 'e1', toPhenomenonId: 'trend', linkType: 'MANIFESTATION_OF', weight: 0.5 },
      ],
      [{ id: 'e1', velocity: 100, lifecycleState: 'CONCLUDED' }],
    );
    expect(result.boost).toBe(0);
  });

  it('flags eventDriven when one link supplies >=50% of the boost', () => {
    const result = applyLinkBoost(
      { id: 'trend', velocity: 10 },
      [
        { fromPhenomenonId: 'e1', toPhenomenonId: 'trend', linkType: 'ACCELERATES', weight: 0.6 },
        { fromPhenomenonId: 'e2', toPhenomenonId: 'trend', linkType: 'CONTRIBUTES_TO', weight: 0.2 },
      ],
      [
        { id: 'e1', velocity: 5, lifecycleState: 'ACTIVE' },
        { id: 'e2', velocity: 1, lifecycleState: 'ACTIVE' },
      ],
    );
    expect(result.boost).toBeGreaterThan(0);
    expect(result.eventDriven).toBe(true);
  });
});
