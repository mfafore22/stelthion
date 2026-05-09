export type FreshnessState = 'fresh' | 'recent' | 'stale' | 'expired';
export type HandlingMode = 'show' | 'show_with_context' | 'review_first' | 'hold';
export type QualityDecision = 'publish' | 'review' | 'reject' | 'hold';
export type UiVisibility = 'visible' | 'contextual' | 'hidden';
export type ChatCaution = 'none' | 'cite_context' | 'cautious' | 'blocked';
export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface QualityEnvelope {
  confidence: number;
  freshness: FreshnessState;
  recency: number;
  sourceStrength: number;
  sourceCount: number;
  contradictionRisk: number;
  divergenceRisk: number;
  feedbackScore: number;
  lifecycleRisk: number;
  sensitivity: SensitivityLevel;
  decision: QualityDecision;
  handling: HandlingMode;
  uiVisibility: UiVisibility;
  chatCaution: ChatCaution;
  reasons: string[];
}

export interface QualityInput {
  confidence: number;
  sourceStrength: number;
  sourceCount?: number;
  contradictionRisk?: number;
  divergenceRisk?: number;
  feedbackScore?: number;
  lifecycleRisk?: number;
  lastObservedAt?: Date | null;
  now?: Date;
  sensitivity?: SensitivityLevel;
}

export interface QualityPolicy {
  freshHours: number;
  recentHours: number;
  staleHours: number;
  weakSourceStrength: number;
  lowConfidence: number;
  reviewConfidence: number;
  reviewSourceStrength: number;
  showConfidence: number;
  showSourceStrength: number;
  contradictionReview: number;
  contradictionHold: number;
  divergenceReview: number;
  negativeFeedbackReview: number;
  lifecycleReview: number;
  minSourceCount: number;
}
