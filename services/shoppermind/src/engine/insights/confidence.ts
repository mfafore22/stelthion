export interface ConfidenceInputs {
  // distinct corroborating sources with weight ≥ strong threshold
  strongSourceCount: number;
  // 0..1 — predictive cadence stability (event-predictor output, 1 = perfectly periodic)
  cadenceStability?: number;
  // # markets where the phenomenon currently scores above its publish bar
  crossMarketCount: number;
  // most recent RawSignal timestamp (or null when nothing observed)
  lastSignalAt: Date | null;
  // 0..1 — link-graph velocity amplification already computed for the score
  linkBoost: number;
  // observation time (defaults to now)
  now?: Date;
}

export interface ConfidenceBreakdown {
  confidence: number;
  components: {
    strongSources: number;
    cadenceStability: number;
    crossMarket: number;
    recency: number;
    linkBoost: number;
  };
}

const STRONG_FLOOR = 2;
const STRONG_CEIL = 6;
const CROSS_MARKET_CEIL = 5;
const RECENCY_HALF_LIFE_DAYS = 14;

function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

function normalize(value: number, floor: number, ceil: number): number {
  if (ceil <= floor) return 0;
  return clamp((value - floor) / (ceil - floor));
}

/**
 * Pure helper that combines the five confidence signals into a 0..1 scalar.
 * Weighting (sums to 1.0): strong sources 0.3, cadence stability 0.2,
 * cross-market corroboration 0.2, recency decay 0.2, link boost 0.1.
 *
 * Rationale: source mix dominates because the project's reliability bar
 * starts there (the composite-source rule is hard at the publish gate).
 * Recency and cross-market corroboration both prevent stale or one-region
 * spikes from looking confident. Link boost is a small bonus — it amplifies
 * an already-corroborated signal but cannot manufacture confidence on its
 * own.
 */
export function computeConfidence(inputs: ConfidenceInputs): ConfidenceBreakdown {
  const now = inputs.now ?? new Date();
  const strongSources = normalize(inputs.strongSourceCount, STRONG_FLOOR, STRONG_CEIL);
  const cadenceStability = clamp(inputs.cadenceStability ?? 0);
  const crossMarket = normalize(inputs.crossMarketCount, 1, CROSS_MARKET_CEIL);
  const recency = recencyDecay(inputs.lastSignalAt, now);
  const linkBoost = clamp(inputs.linkBoost);

  const confidence = clamp(
    0.3 * strongSources +
      0.2 * cadenceStability +
      0.2 * crossMarket +
      0.2 * recency +
      0.1 * linkBoost,
  );

  return {
    confidence: round3(confidence),
    components: {
      strongSources: round3(strongSources),
      cadenceStability: round3(cadenceStability),
      crossMarket: round3(crossMarket),
      recency: round3(recency),
      linkBoost: round3(linkBoost),
    },
  };
}

function recencyDecay(lastSignalAt: Date | null, now: Date): number {
  if (!lastSignalAt) return 0;
  const ageDays = (now.getTime() - lastSignalAt.getTime()) / 86400000;
  if (ageDays <= 0) return 1;
  return clamp(Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS));
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
