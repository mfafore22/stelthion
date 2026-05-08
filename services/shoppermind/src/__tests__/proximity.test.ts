import { describe, it, expect } from 'vitest';
import {
  distanceWeight,
  haversineKm,
  proximityWeight,
} from '../engine/locality/proximity.js';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(60.17, 24.94, 60.17, 24.94)).toBeCloseTo(0, 6);
  });
  it('computes Helsinki↔Tampere distance ~160 km', () => {
    // Helsinki 60.17, 24.94 ; Tampere 61.50, 23.76
    const km = haversineKm(60.17, 24.94, 61.5, 23.76);
    expect(km).toBeGreaterThan(150);
    expect(km).toBeLessThan(180);
  });
});

describe('distanceWeight', () => {
  it('foot-traffic decays steeply', () => {
    expect(distanceWeight(0, 'footTraffic')).toBeCloseTo(1, 6);
    expect(distanceWeight(50, 'footTraffic')).toBeCloseTo(0.5, 3);
    expect(distanceWeight(200, 'footTraffic')).toBeLessThan(0.07);
    expect(distanceWeight(500, 'footTraffic')).toBeLessThan(0.02);
  });
  it('cultural decays shallowly', () => {
    expect(distanceWeight(0, 'cultural')).toBeCloseTo(1, 6);
    expect(distanceWeight(200, 'cultural')).toBeGreaterThan(0.95);
    expect(distanceWeight(1000, 'cultural')).toBeCloseTo(0.5, 3);
    expect(distanceWeight(3000, 'cultural')).toBeLessThan(0.12);
  });
});

describe('proximityWeight — GLOBAL rule', () => {
  const subscribesGlobal = {
    anchor: { lat: 52.52, lon: 13.405 },
    country: 'DE',
    region: 'berlin-de',
    subscriptions: ['COUNTRY:DE', 'GLOBAL'],
  };
  const noGlobal = { ...subscribesGlobal, subscriptions: ['COUNTRY:DE'] };
  it('GLOBAL phenomenon is full-weight when market has GLOBAL on axis', () => {
    expect(proximityWeight({ scope: 'GLOBAL', localityId: 'GLOBAL' }, subscribesGlobal, 'cultural')).toBe(1);
  });
  it('GLOBAL phenomenon is zero without a GLOBAL subscription', () => {
    expect(proximityWeight({ scope: 'GLOBAL', localityId: 'GLOBAL' }, noGlobal, 'cultural')).toBe(0);
  });
});

describe('proximityWeight — hierarchy', () => {
  const tampereCtx = {
    anchor: { lat: 61.4978, lon: 23.7609 },
    country: 'FI',
    region: 'pirkanmaa-fi',
    subscriptions: ['CITY:tampere-fi', 'REGION:pirkanmaa-fi', 'COUNTRY:FI'],
  };
  it('exact (scope, localityId) subscription → 1.0', () => {
    expect(
      proximityWeight(
        { scope: 'CITY', localityId: 'tampere-fi' },
        tampereCtx,
        'footTraffic',
      ),
    ).toBe(1);
  });
  it('parent REGION subscription gives 1.0 cultural, distance-decayed foot-traffic', () => {
    // Lempäälä sits in pirkanmaa-fi, ~25 km from Tampere.
    const lempaala = { scope: 'CITY' as const, localityId: 'lempaala-fi' };
    expect(proximityWeight(lempaala, tampereCtx, 'cultural')).toBe(1);
    const ft = proximityWeight(lempaala, tampereCtx, 'footTraffic');
    expect(ft).toBeGreaterThan(0.7);
    expect(ft).toBeLessThan(1);
  });
  it('parent COUNTRY subscription gives 0.9 cultural, km-decayed foot-traffic', () => {
    // Helsinki sits in uusimaa-fi, ~160 km from Tampere. Not in Tampere's
    // REGION sub, so it falls back to COUNTRY:FI.
    const helsinki = { scope: 'CITY' as const, localityId: 'helsinki-fi' };
    expect(proximityWeight(helsinki, tampereCtx, 'cultural')).toBeCloseTo(0.9, 2);
    const ft = proximityWeight(helsinki, tampereCtx, 'footTraffic');
    expect(ft).toBeLessThan(0.15);
  });
  it('no subscription and no GLOBAL cultural → 0', () => {
    const ctx = { ...tampereCtx, subscriptions: ['CITY:tampere-fi'] };
    expect(
      proximityWeight({ scope: 'COUNTRY', localityId: 'DE' }, ctx, 'cultural'),
    ).toBe(0);
  });
  it('cross-border cultural bleeds through a GLOBAL cultural sub', () => {
    const ctx = { ...tampereCtx, subscriptions: ['COUNTRY:FI', 'GLOBAL'] };
    expect(
      proximityWeight({ scope: 'COUNTRY', localityId: 'DE' }, ctx, 'cultural'),
    ).toBeCloseTo(0.4, 2);
    expect(
      proximityWeight({ scope: 'COUNTRY', localityId: 'DE' }, ctx, 'footTraffic'),
    ).toBe(0);
  });
});
