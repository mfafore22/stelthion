import type { QualityPolicy } from './quality-types.js';

export const DEFAULT_QUALITY_POLICY: QualityPolicy = {
  freshHours: 24,
  recentHours: 168,
  staleHours: 720,
  weakSourceStrength: 0.5,
  lowConfidence: 0.5,
  reviewConfidence: 0.45,
  reviewSourceStrength: 0.35,
  showConfidence: 0.7,
  showSourceStrength: 0.65,
  contradictionReview: 0.4,
  contradictionHold: 0.7,
  divergenceReview: 0.55,
  negativeFeedbackReview: -0.4,
  lifecycleReview: 0.6,
  minSourceCount: 2,
};
