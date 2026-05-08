import { loadMarket } from './registry/market-registry.js';

export interface Weights {
  velocity: number;
  acceleration: number;
  noise: number;
  diversity: number;
}

const DEFAULT_WEIGHTS: Weights = {
  velocity: 0.3,
  acceleration: 0.35,
  noise: 0.2,
  diversity: 0.15,
};

/**
 * Phase 1: weights come directly from the market profile's weightPriors.
 * The legacy ShopperMindConfig table is gone; feedback-aware recalculation
 * is a Phase 3 concern and will live in the policy/Market layer.
 */
export async function getWeights(marketId: string): Promise<Weights> {
  const market = await loadMarket(marketId);
  if (!market) return DEFAULT_WEIGHTS;
  const priors = market.profile.weightPriors;
  return {
    velocity: priors.velocity ?? DEFAULT_WEIGHTS.velocity,
    acceleration: priors.acceleration ?? DEFAULT_WEIGHTS.acceleration,
    noise: priors.noise ?? DEFAULT_WEIGHTS.noise,
    diversity: priors.diversity ?? DEFAULT_WEIGHTS.diversity,
  };
}

/** Phase 3 will re-derive weights from PhenomenonFeedback. Phase 1: no-op. */
export async function recalculateWeights(marketId: string): Promise<Weights> {
  return getWeights(marketId);
}
