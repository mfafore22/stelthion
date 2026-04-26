import { describe, it, expect } from 'vitest';
import { evaluate, DEFAULT_POLICY } from '../engine/policy/policy-engine.js';
import type { MetricsSnapshot } from '../engine/policy/policy-types.js';
import type { MarketPolicy } from '../engine/registry/market-schema.js';

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
    strongSourceCount: 2,
    noiseAdjusted: 5,
    footTrafficScore: 0.5,
    culturalScore: 0.5,
    footTrafficProximity: 1,
    culturalProximity: 1,
    linkBoost: 0,
    compositeScore: 0.7,
    negativeFeedback: 0,
    positiveFeedback: 0,
    ...overrides,
  };
}

describe('composite-source hard gate', () => {
  it('TREND with strongSourceCount < 2 is downgraded from PUBLISH to REVIEW', () => {
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.7, strongSourceCount: 1 }),
      policy: DEFAULT_POLICY,
    });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons.join(' ')).toContain('composite_source_gate strong=1 < min=2');
  });

  it('TREND with strongSourceCount >= 2 still publishes', () => {
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.7, strongSourceCount: 2 }),
      policy: DEFAULT_POLICY,
    });
    expect(result.decision).toBe('PUBLISH');
  });

  it('non-TREND types are not subject to the gate', () => {
    const incident = evaluate({
      snapshot: snap({
        phenomenonType: 'INCIDENT',
        culturalScope: 'CITY',
        compositeScore: 0.5,
        strongSourceCount: 0,
      }),
      policy: DEFAULT_POLICY,
    });
    expect(incident.decision).toBe('PUBLISH');
    expect(incident.reasons.join(' ')).not.toContain('composite_source_gate');
  });

  it('REVIEW decisions remain REVIEW (gate does not promote)', () => {
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.5, strongSourceCount: 1 }),
      policy: DEFAULT_POLICY,
    });
    expect(result.decision).toBe('REVIEW');
  });

  it('REJECT decisions remain REJECT regardless of source count', () => {
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.1, strongSourceCount: 0 }),
      policy: DEFAULT_POLICY,
    });
    expect(result.decision).toBe('REJECT');
  });

  it('market-level minStrongSources override raises the bar', () => {
    const strictPolicy: MarketPolicy = {
      ...DEFAULT_POLICY,
      compositeSource: { minStrongSources: 4, strongSourceWeight: 0.7 },
    };
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.7, strongSourceCount: 3 }),
      policy: strictPolicy,
    });
    expect(result.decision).toBe('REVIEW');
    expect(result.reasons.join(' ')).toContain('strong=3 < min=4');
  });

  it('market-level minStrongSources=0 disables the gate', () => {
    const lenientPolicy: MarketPolicy = {
      ...DEFAULT_POLICY,
      compositeSource: { minStrongSources: 0, strongSourceWeight: 0.7 },
    };
    const result = evaluate({
      snapshot: snap({ compositeScore: 0.7, strongSourceCount: 0 }),
      policy: lenientPolicy,
    });
    expect(result.decision).toBe('PUBLISH');
  });
});
