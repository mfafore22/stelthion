import type { Scope } from '../policy/policy-types.js';
import { listEntries } from './gazetteer.js';

export type ProximityAxis = 'footTraffic' | 'cultural';

export interface MarketProximityContext {
  anchor: { lat: number; lon: number } | null;
  country: string;
  region: string | null;
  subscriptions: string[]; // ["CITY:tampere-fi", "REGION:pirkanmaa-fi", "COUNTRY:FI", "GLOBAL"]
}

export interface PhenomenonLocalityInput {
  scope: Scope;
  localityId: string;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Per-axis distance decay. Foot-traffic falls off sharply with km (people
 * don't drive 200 km to a mall); cultural decays slowly because discourse,
 * trends, and design influence travel much further than bodies do.
 */
export function distanceWeight(km: number, axis: ProximityAxis): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  if (axis === 'footTraffic') {
    // 0 km → 1.0, 50 km → 0.5, 100 km → 0.2, 200 km → 0.06, 500 km → 0.01
    return 1 / (1 + (km / 50) ** 2);
  }
  // cultural: 0 km → 1.0, 200 km → 0.96, 1000 km → 0.5, 3000 km → 0.1, 10000 km → 0.01
  return 1 / (1 + (km / 1000) ** 2);
}

function hasSubscription(
  ctx: MarketProximityContext,
  scope: Scope | 'GLOBAL',
  localityId: string,
): boolean {
  const needle = scope === 'GLOBAL' ? 'GLOBAL' : `${scope}:${localityId}`;
  return ctx.subscriptions.includes(needle);
}

function lookupCoords(localityId: string): { lat: number; lon: number } | null {
  for (const entry of listEntries()) {
    if (entry.footTraffic.localityId !== localityId) continue;
    if (entry.latitude != null && entry.longitude != null) {
      return { lat: entry.latitude, lon: entry.longitude };
    }
  }
  return null;
}

function lookupRegion(localityId: string): string | null {
  for (const entry of listEntries()) {
    if (entry.footTraffic.localityId === localityId && entry.region) {
      return entry.region;
    }
  }
  return null;
}

function lookupCountry(localityId: string): string | null {
  // localityId at COUNTRY scope is already the ISO code
  if (localityId.length === 2 && localityId === localityId.toUpperCase()) {
    return localityId;
  }
  for (const entry of listEntries()) {
    if (entry.footTraffic.localityId === localityId) return entry.country;
  }
  return null;
}

/**
 * Per-axis proximity weight in [0, 1] for a phenomenon locality against a market.
 *
 * Rules:
 *   1. GLOBAL phenomenon:                   1.0 iff market subscribes to GLOBAL on this axis, else 0.
 *   2. Exact (scope, localityId) in subs:   1.0.
 *   3. Phenomenon sits inside a subscribed parent scope (CITY → REGION, CITY/REGION → COUNTRY):
 *        cultural axis:   1.0 for region-match, 0.9 for country-match (discourse covers the area broadly).
 *        foot-traffic:    distance decay from market anchor (people still decay by km even inside the country).
 *   4. No hierarchy match but market has GLOBAL cultural subscription:
 *        cultural axis:   0.4 (cross-border cultural bleed-through).
 *        foot-traffic:    0.
 *   5. No match at all: 0.
 */
export function proximityWeight(
  phenomenon: PhenomenonLocalityInput,
  market: MarketProximityContext,
  axis: ProximityAxis,
): number {
  // 1. GLOBAL phenomenon
  if (phenomenon.scope === 'GLOBAL') {
    return hasSubscription(market, 'GLOBAL', 'GLOBAL') ? 1 : 0;
  }

  // 2. Exact match
  if (hasSubscription(market, phenomenon.scope, phenomenon.localityId)) {
    return 1;
  }

  // 3. Hierarchy match
  const phRegion = phenomenon.scope === 'CITY' ? lookupRegion(phenomenon.localityId) : null;
  const phCountry =
    phenomenon.scope === 'COUNTRY'
      ? phenomenon.localityId
      : lookupCountry(phenomenon.localityId);

  if (phRegion && hasSubscription(market, 'REGION', phRegion)) {
    if (axis === 'cultural') return 1;
    // foot-traffic within a subscribed region: decay by km if we have coords
    return distanceIfPossible(phenomenon, market, axis);
  }

  if (phCountry && hasSubscription(market, 'COUNTRY', phCountry)) {
    if (axis === 'cultural') {
      // Same country: nearly full cultural reach. REGION-scope phenomenon inside a
      // subscribed COUNTRY gets slightly less than a CITY because the phenomenon's
      // own reach is narrower in admin hierarchy than the market's country sub.
      return phenomenon.scope === 'REGION' ? 0.9 : 0.9;
    }
    return distanceIfPossible(phenomenon, market, axis);
  }

  // 4. GLOBAL cultural fallback (cross-border cultural bleed-through)
  if (axis === 'cultural' && hasSubscription(market, 'GLOBAL', 'GLOBAL')) {
    return 0.4;
  }

  return 0;
}

function distanceIfPossible(
  phenomenon: PhenomenonLocalityInput,
  market: MarketProximityContext,
  axis: ProximityAxis,
): number {
  if (!market.anchor) {
    // No coords on the market side — fall back to a mid-tier admin weight.
    return axis === 'footTraffic' ? 0.25 : 0.6;
  }
  const coords = lookupCoords(phenomenon.localityId);
  if (!coords) {
    return axis === 'footTraffic' ? 0.2 : 0.5;
  }
  const km = haversineKm(coords.lat, coords.lon, market.anchor.lat, market.anchor.lon);
  return distanceWeight(km, axis);
}
