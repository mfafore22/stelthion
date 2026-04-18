import { describe, it, expect } from 'vitest';
import { evaluate, DEFAULT_POLICY } from '../engine/policy/policy-engine.js';
import type { MetricsSnapshot } from '../engine/policy/policy-types.js';

function snap(overrides: Partial<MetricsSnapshot>): MetricsSnapshot {
  return {
    date: '2026-04-01',
    marketId: 'test-market',
    country: 'FI',
    phenomenonId: 'p1',
    phenomenonType: 'TREND',
    lifecycleState: null,
    culturalScope: 'COUNTRY',
    culturalLocality: 'FI',
    footTrafficScope: 'COUNTRY',
    footTrafficLocality: 'FI',
    volume: 10,
    velocity: 5,
    acceleration: 0,
    sourceDiversity: 1,
    noiseAdjusted: 5,
    footTrafficScore: 0.5,
    culturalScore: 0.5,
    footTrafficProximity: 1,
    culturalProximity: 1,
    linkBoost: 0,
    compositeScore: 0.5,
    negativeFeedback: 0,
    positiveFeedback: 0,
    ...overrides,
  };
}

describe('evaluate — per (type, scope) thresholds', () => {
  it('TREND COUNTRY publishes at 0.65, reviews at 0.5, rejects at 0.3', () => {
    expect(evaluate({ snapshot: snap({ compositeScore: 0.65 }), policy: DEFAULT_POLICY }).decision).toBe('PUBLISH');
    expect(evaluate({ snapshot: snap({ compositeScore: 0.5 }), policy: DEFAULT_POLICY }).decision).toBe('REVIEW');
    expect(evaluate({ snapshot: snap({ compositeScore: 0.3 }), policy: DEFAULT_POLICY }).decision).toBe('REJECT');
  });

  it('INCIDENT bars are lower than TREND bars at the same scope', () => {
    const incident = snap({ phenomenonType: 'INCIDENT', compositeScore: 0.5, culturalScope: 'CITY' });
    const trend = snap({ phenomenonType: 'TREND', compositeScore: 0.5, culturalScope: 'CITY' });
    const incidentResult = evaluate({ snapshot: incident, policy: DEFAULT_POLICY });
    const trendResult = evaluate({ snapshot: trend, policy: DEFAULT_POLICY });
    // same score, incident should publish while trend reviews
    expect(incidentResult.decision).toBe('PUBLISH');
    expect(trendResult.decision).toBe('REVIEW');
  });

  it('UPCOMING lifecycle lowers effective publish bar', () => {
    const upcoming = snap({
      phenomenonType: 'EVENT',
      compositeScore: 0.47,
      lifecycleState: 'UPCOMING',
      culturalScope: 'COUNTRY',
    });
    const result = evaluate({ snapshot: upcoming, policy: DEFAULT_POLICY });
    // EVENT COUNTRY publish 0.55 + UPCOMING -0.1 = 0.45 effective → 0.47 ≥ 0.45 → PUBLISH
    expect(result.decision).toBe('PUBLISH');
  });

  it('strong negative feedback rejects even when score would otherwise pass review', () => {
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.5, negativeFeedback: 5 }),
      policy: DEFAULT_POLICY,
    });
    expect(result.decision).toBe('REJECT');
    expect(result.reasons.join(' ')).toContain('strong_negative_feedback');
  });

  it('falls back through market → default when market omits a tier', () => {
    const marketPolicy = {
      version: 1 as const,
      thresholds: {
        // Market overrides TREND COUNTRY but not CITY
        'TREND:composite:COUNTRY': { publish: 0.8, review: 0.6, reject: 0.4 },
      },
      lifecycleModifiers: { UPCOMING: -0.1, ACTIVE: 0, CONCLUDED: 0.2 },
    };
    // CITY score should fall back to DEFAULT_POLICY TREND:CITY (publish 0.5)
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.5, culturalScope: 'CITY' }),
      policy: marketPolicy,
    });
    expect(result.decision).toBe('PUBLISH');
    expect(result.reasons.some((r) => r.includes('threshold source'))).toBe(true);
  });
});
