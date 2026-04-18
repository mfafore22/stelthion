import type { MarketPolicy } from './policy-types.js';

// Phase 1 ships a single threshold tier: TREND × composite × COUNTRY.
// Phase 2 extends to the full (type × axis × scope) matrix.
export const DEFAULT_POLICY: MarketPolicy = {
  version: 1,
  thresholds: {
    'TREND:composite:COUNTRY': { publish: 0.6, review: 0.4, reject: 0.2 },
  },
  lifecycleModifiers: { UPCOMING: -0.1, ACTIVE: 0, CONCLUDED: 0.2 },
};
