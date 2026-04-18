import { DEFAULT_POLICY } from './default-policies.js';
import type {
  Axis,
  MetricsSnapshot,
  MarketPolicy,
  PolicyInput,
  PolicyResult,
  Scope,
} from './policy-types.js';

function thresholdKey(type: MetricsSnapshot['phenomenonType'], axis: Axis, scope: Scope): string {
  return `${type}:${axis}:${scope}`;
}

// Pure function: given a metrics snapshot + policy + recent feedback summary in the snapshot,
// return the gate decision. No I/O. Table-driven over (type, axis, scope) thresholds with
// lifecycle modifiers applied to EVENT / CAMPAIGN / INCIDENT rows.
export function evaluate({ snapshot, policy }: PolicyInput): PolicyResult {
  const axis: Axis = 'composite';
  const key = thresholdKey(snapshot.phenomenonType, axis, snapshot.culturalScope);
  const table = (policy ?? DEFAULT_POLICY).thresholds;
  const base =
    table[key] ??
    table[thresholdKey(snapshot.phenomenonType, axis, 'COUNTRY')] ??
    DEFAULT_POLICY.thresholds['TREND:composite:COUNTRY'];

  const lifecycleShift =
    snapshot.lifecycleState && policy.lifecycleModifiers
      ? (policy.lifecycleModifiers[snapshot.lifecycleState] ?? 0)
      : 0;

  const effective = {
    publish: base.publish + lifecycleShift,
    review: base.review + lifecycleShift,
    reject: base.reject + lifecycleShift,
  };

  const score = snapshot.compositeScore;
  const reasons: string[] = [];
  let decision: PolicyResult['decision'];

  if (snapshot.negativeFeedback >= 3 && score < effective.publish) {
    decision = 'REJECT';
    reasons.push(`strong_negative_feedback (${snapshot.negativeFeedback})`);
  } else if (score >= effective.publish) {
    decision = 'PUBLISH';
    reasons.push(`composite ${score.toFixed(3)} >= publish ${effective.publish.toFixed(3)}`);
  } else if (score >= effective.review) {
    decision = 'REVIEW';
    reasons.push(`composite ${score.toFixed(3)} in [${effective.review.toFixed(3)}, ${effective.publish.toFixed(3)})`);
  } else {
    decision = 'REJECT';
    reasons.push(`composite ${score.toFixed(3)} < review ${effective.review.toFixed(3)}`);
  }

  if (snapshot.lifecycleState) {
    reasons.push(`lifecycle=${snapshot.lifecycleState} modifier=${lifecycleShift.toFixed(2)}`);
  }
  if (snapshot.phenomenonType !== 'TREND') {
    reasons.push(`type=${snapshot.phenomenonType}`);
  }
  if (snapshot.linkBoost > 0) {
    reasons.push(`linkBoost=${snapshot.linkBoost.toFixed(3)}`);
  }

  return { decision, reasons, snapshot, effectiveThreshold: effective, thresholdKey: key };
}

export { DEFAULT_POLICY };
export type { MarketPolicy, MetricsSnapshot, PolicyResult };
