import type { PhenomenonState } from '../../../node_modules/.prisma/shoppermind-client/index.js';

/**
 * Derive a per-market PhenomenonState from a single recent score row.
 * The phenomenon-wide classifier in scoring.ts looks at the trailing
 * three days; the grid wants a per-market read from the latest available
 * row (we may only have one for bootstrap or fresh markets). Bands match
 * the values seed-bootstrap-trends.ts emits, so the round-trip is
 * lossless for seeded rows.
 */
export function classifyMarketState(score: {
  volume: number;
  velocity: number;
  acceleration: number;
}): PhenomenonState {
  if (score.volume <= 10 && score.velocity < 0 && score.velocity > -0.06) return 'DORMANT';
  if (score.velocity >= 0.5) return 'ACCELERATING';
  if (score.velocity >= 0.25) return 'EMERGING';
  if (score.velocity <= -0.06) return 'FADING';
  return 'STABLE';
}
