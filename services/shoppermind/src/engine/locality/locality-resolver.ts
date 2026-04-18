import type { RawSignalInput } from '../types.js';
import type { MarketConfig } from '../registry/market-schema.js';
import type { Scope } from '../policy/policy-types.js';
import { findInText } from './gazetteer.js';

export interface ResolvedLocality {
  scope: Scope;
  localityId: string;
  confidence: number;
}

export interface DualAxisLocality {
  footTraffic: ResolvedLocality;
  cultural: ResolvedLocality;
}

const GLOBAL_KEYWORDS = [
  'global',
  'worldwide',
  'international',
  'cross-border',
  'cross border',
  'across countries',
  'worldwide-trend',
  'global trend',
  'worldwide trend',
  'pan-european',
  'pan european',
  'eu-wide',
  'eu wide',
];

function hasGlobalSignal(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return GLOBAL_KEYWORDS.some((kw) => lower.includes(kw));
}

function signalText(signal: RawSignalInput): string {
  return [signal.title, signal.summary ?? ''].join(' ').trim();
}

/**
 * Dual-axis locality resolution.
 *
 * The two axes are independent: a signal about Asuntomessut Lempäälä resolves
 * to foot-traffic CITY:lempaala-fi but cultural COUNTRY:FI (because the
 * housing fair shapes nationwide discourse even for readers who never attend).
 *
 * Resolution order per axis:
 *   1. Gazetteer hit on (title + summary). The gazetteer encodes the
 *      foot-traffic locality and an optional culturalLiftDefault for places
 *      whose cultural reach exceeds their physical reach.
 *   2. Explicit global keyword in text → lifts cultural to GLOBAL.
 *   3. Signal's declared country as COUNTRY-scope fallback on both axes.
 *
 * LLM fallback is intentionally not wired here — this layer stays pure and
 * deterministic. The classifier and scoring layers call LLM helpers when the
 * returned confidence is below the market's review threshold.
 */
export function resolveLocality(
  signal: RawSignalInput,
  market: MarketConfig,
): DualAxisLocality {
  const text = signalText(signal);
  const hit = findInText(text);
  const global = hasGlobalSignal(text);

  const countryFallback: ResolvedLocality = {
    scope: 'COUNTRY',
    localityId: signal.country || market.country,
    confidence: 0.6,
  };

  let footTraffic: ResolvedLocality = countryFallback;
  let cultural: ResolvedLocality = countryFallback;

  if (hit) {
    footTraffic = {
      scope: hit.footTraffic.scope,
      localityId: hit.footTraffic.localityId,
      confidence: 0.9,
    };
    if (hit.culturalLiftDefault) {
      cultural = {
        scope: hit.culturalLiftDefault.scope,
        localityId: hit.culturalLiftDefault.localityId,
        confidence: 0.9,
      };
    } else {
      // Without an explicit lift, cultural defaults to the same admin level
      // as foot-traffic. Downstream gate logic can still lift via link
      // inference when a CITY-scope signal demonstrably rides a country-wide
      // trend narrative.
      cultural = {
        scope: hit.footTraffic.scope,
        localityId: hit.footTraffic.localityId,
        confidence: 0.85,
      };
    }
  }

  if (global) {
    // Explicit global cue trumps any inferred scope on the cultural axis.
    cultural = {
      scope: 'GLOBAL',
      localityId: 'GLOBAL',
      confidence: 0.95,
    };
  }

  return { footTraffic, cultural };
}
