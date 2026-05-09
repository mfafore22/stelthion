export type IntelligenceDomain = string;

export type RuntimeStageKind =
  | 'collect'
  | 'enrich'
  | 'score'
  | 'validate'
  | 'publish'
  | 'review'
  | 'learn'
  | 'cache';

export type RuntimeStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'partial'
  | 'failed'
  | 'cancelled';

export interface RuntimeScope {
  customerId?: string;
  propertyId?: string;
  marketId?: string;
  venueId?: string;
  locale?: string;
}

export interface RuntimeActor {
  id: string;
  role: string;
  customerScopes: string[];
  marketScopes?: string[];
  propertyScopes?: string[];
  venueScopes?: string[];
}

export interface RuntimeContext {
  runId: string;
  domain: IntelligenceDomain;
  scope: RuntimeScope;
  actor: RuntimeActor;
  correlationId: string;
  startedAt: string;
}

export interface RuntimeStage {
  name: RuntimeStageKind;
  status: RuntimeStatus;
  startedAt?: string;
  finishedAt?: string;
  inputCount?: number;
  outputCount?: number;
  errorCode?: string;
}

export interface RuntimeDecision {
  id: string;
  stage: RuntimeStageKind;
  decision: 'publish' | 'review' | 'reject' | 'hold';
  reasons: string[];
  createdAt: string;
}

export interface RuntimeArtifact {
  id: string;
  runId: string;
  type: 'memory_document' | 'user_result' | 'review_item' | 'training_event';
  entityId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeRun {
  id: string;
  domain: IntelligenceDomain;
  scope: RuntimeScope;
  status: RuntimeStatus;
  stages: RuntimeStage[];
  decisions: RuntimeDecision[];
  artifactIds: string[];
  actorId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}
