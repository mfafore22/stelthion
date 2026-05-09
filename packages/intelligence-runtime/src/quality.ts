import {
  decideChatCaution,
  decideHandling,
  decideQualityDecision,
  decideUiVisibility,
  recencyScore,
} from './quality-decision.js';
import { DEFAULT_QUALITY_POLICY } from './quality-policy.js';
import type {
  FreshnessState,
  QualityEnvelope,
  QualityInput,
  QualityPolicy,
} from './quality-types.js';

export { DEFAULT_QUALITY_POLICY } from './quality-policy.js';
export type {
  ChatCaution,
  FreshnessState,
  HandlingMode,
  QualityDecision,
  QualityEnvelope,
  QualityInput,
  QualityPolicy,
  SensitivityLevel,
  UiVisibility,
} from './quality-types.js';

export function classifyFreshness(
  lastObservedAt: Date | null | undefined,
  now = new Date(),
  policy: QualityPolicy = DEFAULT_QUALITY_POLICY,
): FreshnessState {
  if (!lastObservedAt) return 'expired';
  const ageHours = (now.getTime() - lastObservedAt.getTime()) / 3_600_000;
  if (ageHours <= policy.freshHours) return 'fresh';
  if (ageHours <= policy.recentHours) return 'recent';
  if (ageHours <= policy.staleHours) return 'stale';
  return 'expired';
}

export function buildQualityEnvelope(
  input: QualityInput,
  policy: QualityPolicy = DEFAULT_QUALITY_POLICY,
): QualityEnvelope {
  const freshness = classifyFreshness(input.lastObservedAt, input.now, policy);
  const recency = recencyScore(freshness);
  const contradictionRisk = input.contradictionRisk ?? 0;
  const divergenceRisk = input.divergenceRisk ?? 0;
  const feedbackScore = input.feedbackScore ?? 0;
  const lifecycleRisk = input.lifecycleRisk ?? 0;
  const sourceCount = input.sourceCount ?? 0;
  const sensitivity = input.sensitivity ?? 'low';
  const reasons: string[] = [];

  if (freshness === 'stale' || freshness === 'expired') reasons.push(`freshness=${freshness}`);
  if (sourceCount < policy.minSourceCount) reasons.push('low_source_count');
  if (input.sourceStrength < policy.weakSourceStrength) reasons.push('weak_source_strength');
  if (input.confidence < policy.lowConfidence) reasons.push('low_confidence');
  if (contradictionRisk >= policy.contradictionReview) reasons.push('contradiction_risk');
  if (divergenceRisk >= policy.divergenceReview) reasons.push('divergence_risk');
  if (feedbackScore <= policy.negativeFeedbackReview) reasons.push('negative_feedback');
  if (lifecycleRisk >= policy.lifecycleReview) reasons.push('lifecycle_risk');
  if (sensitivity === 'high') reasons.push('high_sensitivity');

  const handling = decideHandling({
    confidence: input.confidence,
    sourceStrength: input.sourceStrength,
    sourceCount,
    contradictionRisk,
    divergenceRisk,
    feedbackScore,
    lifecycleRisk,
    freshness,
    sensitivity,
    policy,
  });
  const decision = decideQualityDecision(handling, input.confidence, input.sourceStrength, policy);
  return {
    confidence: input.confidence,
    freshness,
    recency,
    sourceStrength: input.sourceStrength,
    sourceCount,
    contradictionRisk,
    divergenceRisk,
    feedbackScore,
    lifecycleRisk,
    sensitivity,
    decision,
    handling,
    uiVisibility: decideUiVisibility(handling),
    chatCaution: decideChatCaution(handling),
    reasons,
  };
}
