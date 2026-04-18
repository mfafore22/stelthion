import { DEFAULT_POLICY } from './default-policies.js';
import type {
  Axis,
  MetricsSnapshot,
  MarketPolicy,
  PolicyInput,
  PolicyResult,
  Scope,
} from './policy-types.js';

function thresholdKey(
  type: MetricsSnapshot['phenomenonType'],
  axis: Axis,
  scope: Scope,
): string {
  return `${type}:${axis}:${scope}`;
}

type ThresholdTier = { publish: number; review: number; reject: number };

/**
 * Look up a threshold tier with cascading fallbacks so a market only has
 * to declare the cells where it diverges from the defaults:
 *   1. market-policy table: exact (type, axis, scope)
 *   2. market-policy table: (type, axis, COUNTRY)
 *   3. default-policy table: exact (type, axis, scope)
 *   4. default-policy table: (type, axis, COUNTRY)
 *   5. default-policy table: TREND:composite:COUNTRY (anchor)
 */
function resolveThreshold(
  policy: MarketPolicy,
  type: MetricsSnapshot['phenomenonType'],
  axis: Axis,
  scope: Scope,
): { tier: ThresholdTier; key: string; source: 'market' | 'market-country' | 'default' | 'default-country' | 'anchor' } {
  const wanted = thresholdKey(type, axis, scope);
  const marketCountry = thresholdKey(type, axis, 'COUNTRY');
  const defaults = DEFAULT_POLICY.thresholds;

  if (policy.thresholds[wanted]) {
    return { tier: policy.thresholds[wanted], key: wanted, source: 'market' };
  }
  if (policy.thresholds[marketCountry]) {
    return { tier: policy.thresholds[marketCountry], key: marketCountry, source: 'market-country' };
  }
  if (defaults[wanted]) {
    return { tier: defaults[wanted], key: wanted, source: 'default' };
  }
  if (defaults[marketCountry]) {
    return { tier: defaults[marketCountry], key: marketCountry, source: 'default-country' };
  }
  return {
    tier: defaults['TREND:composite:COUNTRY'],
    key: 'TREND:composite:COUNTRY',
    source: 'anchor',
  };
}

/**
 * Pure function: given a metrics snapshot, a market policy, and any
 * feedback summary already materialised in the snapshot, return the gate
 * decision. Table-driven over (type, axis, scope) thresholds with lifecycle
 * modifiers applied to EVENT / CAMPAIGN / INCIDENT rows.
 */
export function evaluate({ snapshot, policy }: PolicyInput): PolicyResult {
  const axis: Axis = 'composite';
  const effectivePolicy = policy ?? DEFAULT_POLICY;
  const resolved = resolveThreshold(
    effectivePolicy,
    snapshot.phenomenonType,
    axis,
    snapshot.culturalScope,
  );

  const lifecycleShift =
    snapshot.lifecycleState && effectivePolicy.lifecycleModifiers
      ? (effectivePolicy.lifecycleModifiers[snapshot.lifecycleState] ?? 0)
      : 0;

  // Feedback-aware shift: positive thumbs lower the publish bar, negative thumbs
  // raise it. Both are clamped per-direction so a single viral phenomenon can't
  // collapse the gate entirely. Net shift = positiveLift + negativeLift where
  // positiveLift is ≤ 0 and negativeLift is ≥ 0.
  const fs = effectivePolicy.feedbackSensitivity;
  let feedbackShift = 0;
  if (fs) {
    const posShift = -Math.min(
      snapshot.positiveFeedback * fs.positivePerUnit,
      fs.maxPositiveShift,
    );
    const negShift = Math.min(
      snapshot.negativeFeedback * fs.negativePerUnit,
      fs.maxNegativeShift,
    );
    feedbackShift = posShift + negShift;
  }

  const effective = {
    publish: resolved.tier.publish + lifecycleShift + feedbackShift,
    review: resolved.tier.review + lifecycleShift + feedbackShift,
    reject: resolved.tier.reject + lifecycleShift + feedbackShift,
  };

  const score = snapshot.compositeScore;
  const reasons: string[] = [];
  let decision: PolicyResult['decision'];

  if (snapshot.negativeFeedback >= 3 && score < effective.publish) {
    decision = 'REJECT';
    reasons.push(`strong_negative_feedback (${snapshot.negativeFeedback})`);
  } else if (score >= effective.publish) {
    decision = 'PUBLISH';
    reasons.push(
      `composite ${score.toFixed(3)} >= publish ${effective.publish.toFixed(3)}`,
    );
  } else if (score >= effective.review) {
    decision = 'REVIEW';
    reasons.push(
      `composite ${score.toFixed(3)} in [${effective.review.toFixed(3)}, ${effective.publish.toFixed(3)})`,
    );
  } else {
    decision = 'REJECT';
    reasons.push(
      `composite ${score.toFixed(3)} < review ${effective.review.toFixed(3)}`,
    );
  }

  reasons.push(`threshold source=${resolved.source} key=${resolved.key}`);
  if (snapshot.lifecycleState) {
    reasons.push(
      `lifecycle=${snapshot.lifecycleState} modifier=${lifecycleShift.toFixed(2)}`,
    );
  }
  if (snapshot.phenomenonType !== 'TREND') {
    reasons.push(`type=${snapshot.phenomenonType}`);
  }
  if (snapshot.linkBoost > 0) {
    reasons.push(`linkBoost=${snapshot.linkBoost.toFixed(3)}`);
  }
  if (feedbackShift !== 0) {
    reasons.push(
      `feedback pos=${snapshot.positiveFeedback} neg=${snapshot.negativeFeedback} shift=${feedbackShift >= 0 ? '+' : ''}${feedbackShift.toFixed(3)}`,
    );
  }

  return {
    decision,
    reasons,
    snapshot,
    effectiveThreshold: effective,
    thresholdKey: resolved.key,
  };
}

export { DEFAULT_POLICY };
export type { MarketPolicy, MetricsSnapshot, PolicyResult };
