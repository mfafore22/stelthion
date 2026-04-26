import { describe, it, expect } from 'vitest';
import { computeConfidence } from '../engine/insights/confidence.js';

const NOW = new Date('2026-04-26T00:00:00Z');

describe('computeConfidence', () => {
  it('returns 0 when nothing is known', () => {
    const { confidence, components } = computeConfidence({
      strongSourceCount: 0,
      crossMarketCount: 0,
      lastSignalAt: null,
      linkBoost: 0,
      now: NOW,
    });
    expect(confidence).toBe(0);
    expect(components.strongSources).toBe(0);
    expect(components.recency).toBe(0);
  });

  it('peaks near 1 when every component is maxed', () => {
    const { confidence } = computeConfidence({
      strongSourceCount: 10,
      cadenceStability: 1,
      crossMarketCount: 10,
      lastSignalAt: NOW,
      linkBoost: 1,
      now: NOW,
    });
    expect(confidence).toBe(1);
  });

  it('weights strong sources at 30% (largest component)', () => {
    const { confidence, components } = computeConfidence({
      strongSourceCount: 6,
      crossMarketCount: 1,
      lastSignalAt: null,
      linkBoost: 0,
      now: NOW,
    });
    expect(components.strongSources).toBe(1);
    expect(confidence).toBeCloseTo(0.3, 2);
  });

  it('decays with recency on a 14-day half-life', () => {
    const fourteenDaysAgo = new Date(NOW.getTime() - 14 * 86400000);
    const { components } = computeConfidence({
      strongSourceCount: 0,
      crossMarketCount: 0,
      lastSignalAt: fourteenDaysAgo,
      linkBoost: 0,
      now: NOW,
    });
    expect(components.recency).toBeCloseTo(0.5, 2);
  });

  it('floor of 2 strong sources for the strong-sources component', () => {
    const below = computeConfidence({
      strongSourceCount: 1,
      crossMarketCount: 0,
      lastSignalAt: null,
      linkBoost: 0,
      now: NOW,
    });
    const at = computeConfidence({
      strongSourceCount: 2,
      crossMarketCount: 0,
      lastSignalAt: null,
      linkBoost: 0,
      now: NOW,
    });
    expect(below.components.strongSources).toBe(0);
    expect(at.components.strongSources).toBeCloseTo(0, 2);
  });

  it('clamps and rounds output components', () => {
    const { components } = computeConfidence({
      strongSourceCount: 2,
      cadenceStability: 1.7,
      crossMarketCount: 100,
      lastSignalAt: NOW,
      linkBoost: 99,
      now: NOW,
    });
    expect(components.cadenceStability).toBe(1);
    expect(components.crossMarket).toBe(1);
    expect(components.linkBoost).toBe(1);
  });
});
