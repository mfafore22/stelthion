import type { RuntimeScope, IntelligenceDomain } from './runtime.js';
import type { QualityDecision, QualityEnvelope, QualityPolicy } from './quality-types.js';

export type PolicyTrainingSource =
  | 'review_outcome'
  | 'user_feedback'
  | 'offline_evaluation'
  | 'shadow_evaluation';

export type PolicyTrainingOutcome =
  | 'accepted'
  | 'rejected'
  | 'corrected'
  | 'expired'
  | 'ignored';

export type PolicyPackStatus = 'draft' | 'shadow' | 'active' | 'retired';
export type PolicyMaturityStage = 'pilot' | 'controlled' | 'production' | (string & {});

export interface PolicyTrainingEvent {
  id: string;
  domain: IntelligenceDomain;
  scope: RuntimeScope;
  source: PolicyTrainingSource;
  resultId: string;
  outcome: PolicyTrainingOutcome;
  observedAt: string;
  actorId?: string;
  policyPackId?: string;
  quality?: QualityEnvelope;
  features?: Record<string, unknown>;
  labels?: Record<string, unknown>;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyPack {
  id: string;
  domain: IntelligenceDomain;
  version: string;
  maturityStage: PolicyMaturityStage;
  status: PolicyPackStatus;
  marketId?: string;
  qualityPolicy?: QualityPolicy;
  validationProfileId?: string;
  createdAt: string;
  activatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluationCase {
  id: string;
  scope?: RuntimeScope;
  expectedDecision: QualityDecision;
  features: Record<string, unknown>;
  labels?: Record<string, unknown>;
  weight?: number;
}

export interface EvaluationDataset {
  id: string;
  domain: IntelligenceDomain;
  cases: EvaluationCase[];
  marketId?: string;
  maturityStage?: PolicyMaturityStage;
  createdAt: string;
}

export interface PolicyPrediction {
  caseId: string;
  policyPackId: string;
  decision: QualityDecision;
  confidence?: number;
  reasons: string[];
}

export interface EvaluationGate {
  metric: 'accuracy' | 'weighted_accuracy' | 'regression_rate' | 'coverage';
  min?: number;
  max?: number;
}

export interface EvaluationGateResult extends EvaluationGate {
  value: number;
  passed: boolean;
}

export interface PolicyEvaluationMetrics {
  accuracy: number;
  weightedAccuracy: number;
  currentAccuracy: number;
  regressionRate: number;
  coverage: number;
}

export interface PolicyEvaluationResult {
  datasetId: string;
  currentPolicyPackId: string;
  candidatePolicyPackId: string;
  status: 'pass' | 'fail';
  metrics: PolicyEvaluationMetrics;
  gates: EvaluationGateResult[];
  regressionCaseIds: string[];
  evaluatedAt: string;
}
