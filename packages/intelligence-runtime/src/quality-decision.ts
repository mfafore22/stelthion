import type {
  ChatCaution,
  FreshnessState,
  HandlingMode,
  QualityDecision,
  QualityPolicy,
  SensitivityLevel,
  UiVisibility,
} from './quality-types.js';

export interface QualityDecisionInput {
  confidence: number;
  sourceStrength: number;
  contradictionRisk: number;
  divergenceRisk: number;
  feedbackScore: number;
  lifecycleRisk: number;
  sourceCount: number;
  freshness: FreshnessState;
  sensitivity: SensitivityLevel;
  policy: QualityPolicy;
}

export function decideHandling(input: QualityDecisionInput): HandlingMode {
  const p = input.policy;
  if (input.freshness === 'expired' || input.contradictionRisk >= p.contradictionHold) {
    return 'hold';
  }
  if (input.sensitivity === 'high' || input.sourceCount < p.minSourceCount) {
    return 'review_first';
  }
  if (input.confidence < p.reviewConfidence || input.sourceStrength < p.reviewSourceStrength) {
    return 'review_first';
  }
  if (input.divergenceRisk >= p.divergenceReview || input.feedbackScore <= p.negativeFeedbackReview) {
    return 'review_first';
  }
  if (input.lifecycleRisk >= p.lifecycleReview) return 'review_first';
  if (
    input.freshness === 'stale' ||
    input.confidence < p.showConfidence ||
    input.sourceStrength < p.showSourceStrength
  ) {
    return 'show_with_context';
  }
  return 'show';
}

export function decideQualityDecision(
  handling: HandlingMode,
  confidence: number,
  sourceStrength: number,
  policy: QualityPolicy,
): QualityDecision {
  if (handling === 'hold') return 'hold';
  if (handling === 'review_first') return 'review';
  if (confidence < policy.reviewConfidence || sourceStrength < policy.reviewSourceStrength) {
    return 'reject';
  }
  return 'publish';
}

export function decideUiVisibility(handling: HandlingMode): UiVisibility {
  if (handling === 'hold') return 'hidden';
  if (handling === 'show') return 'visible';
  return 'contextual';
}

export function decideChatCaution(handling: HandlingMode): ChatCaution {
  if (handling === 'hold') return 'blocked';
  if (handling === 'review_first') return 'cautious';
  if (handling === 'show_with_context') return 'cite_context';
  return 'none';
}

export function recencyScore(freshness: FreshnessState): number {
  if (freshness === 'fresh') return 1;
  if (freshness === 'recent') return 0.75;
  if (freshness === 'stale') return 0.35;
  return 0;
}
