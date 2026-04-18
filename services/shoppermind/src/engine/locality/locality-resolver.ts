import type { RawSignalInput } from '../types.js';
import type { MarketConfig } from '../registry/market-schema.js';
import type { Scope } from '../policy/policy-types.js';

export interface ResolvedLocality {
  scope: Scope;
  localityId: string;
  confidence: number;
}

export interface DualAxisLocality {
  footTraffic: ResolvedLocality;
  cultural: ResolvedLocality;
}

// Phase 1: stub that always returns COUNTRY on both axes, using the market's country.
// Phase 2 replaces this with gazetteer + keyword + LLM fallback resolving the two axes
// independently (see plan: locality/locality-resolver).
export function resolveLocality(
  _signal: RawSignalInput,
  market: MarketConfig,
): DualAxisLocality {
  const country: Scope = 'COUNTRY';
  return {
    footTraffic: { scope: country, localityId: market.country, confidence: 1 },
    cultural: { scope: country, localityId: market.country, confidence: 1 },
  };
}
