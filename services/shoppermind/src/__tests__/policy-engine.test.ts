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

  it('positive feedback lowers the publish bar up to the cap', () => {
    // TREND COUNTRY publish = 0.6; 3 positive × 0.02 = 0.06 shift → effective 0.54
    const borderline = evaluate({
      snapshot: snap({ compositeScore: 0.55, positiveFeedback: 3 }),
      policy: DEFAULT_POLICY,
    });
    expect(borderline.decision).toBe('PUBLISH');
    expect(borderline.reasons.join(' ')).toContain('feedback pos=3');

    // Without feedback, same 0.55 would only review
    const baseline = evaluate({
      snapshot: snap({ compositeScore: 0.55 }),
      policy: DEFAULT_POLICY,
    });
    expect(baseline.decision).toBe('REVIEW');
  });

  it('positive shift is capped so a single phenomenon cannot collapse the gate', () => {
    // 100 × 0.02 = 2.0, capped at maxPositiveShift=0.08 → effective publish 0.52
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.4, positiveFeedback: 100 }),
      policy: DEFAULT_POLICY,
    });
    // 0.4 still < 0.52 (capped effective) → REVIEW, not PUBLISH
    expect(result.decision).toBe('REVIEW');
  });

  it('mild negative feedback raises the bar without tripping hard-reject', () => {
    // 2 negatives doesn't hit hard-reject (>=3), but raises bar by 0.06
    const borderline = evaluate({
      snapshot: snap({ compositeScore: 0.62, negativeFeedback: 2 }),
      policy: DEFAULT_POLICY,
    });
    // Baseline 0.6 + 0.06 = 0.66; 0.62 < 0.66 → REVIEW
    expect(borderline.decision).toBe('REVIEW');
    expect(borderline.reasons.join(' ')).toContain('feedback pos=0 neg=2');
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
