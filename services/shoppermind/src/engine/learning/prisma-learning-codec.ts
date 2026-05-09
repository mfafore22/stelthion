import { createHash } from 'node:crypto';
import {
  learningRetentionDates,
  shouldRetainLearningLabels,
  shouldRetainLearningMetadata,
  shouldRetainLearningNotes,
  type LearningRetentionPolicy,
  type PolicyEvaluationResult,
  type PolicyPack,
  type PolicyTrainingEvent,
  type TrainingEventFilter,
} from '@stelthion/intelligence-runtime';

export type JsonRecord = Record<string, unknown>;

export function trainingEventToRow(
  event: PolicyTrainingEvent,
  retention: LearningRetentionPolicy,
): JsonRecord {
  const dates = learningRetentionDates(event.observedAt, retention);
  return compact({
    id: event.id,
    domain: event.domain,
    scope: event.scope,
    source: event.source,
    resultId: event.resultId,
    outcome: event.outcome,
    observedAt: new Date(event.observedAt),
    actorIdHash: event.actorId ? actorHash(event.actorId) : undefined,
    policyPackId: event.policyPackId,
    quality: event.quality,
    features: redactJson(event.features),
    labels: shouldRetainLearningLabels(retention) ? redactJson(event.labels) : undefined,
    notes: shouldRetainLearningNotes(retention) ? event.notes : undefined,
    metadata: shouldRetainLearningMetadata(retention) ? redactJson(event.metadata) : undefined,
    piiExpiresAt: new Date(dates.piiExpiresAt),
    retentionExpiresAt: new Date(dates.retentionExpiresAt),
  });
}

export function trainingEventWhere(filter: TrainingEventFilter): JsonRecord {
  const observedAt = compact({
    gte: filter.since ? new Date(filter.since) : undefined,
    lte: filter.until ? new Date(filter.until) : undefined,
  });
  return compact({
    domain: filter.domain,
    source: filter.source,
    scope: filter.marketId ? { path: ['marketId'], equals: filter.marketId } : undefined,
    observedAt: Object.keys(observedAt).length > 0 ? observedAt : undefined,
  });
}

export function rowToTrainingEvent(row: JsonRecord): PolicyTrainingEvent {
  return {
    id: String(row.id),
    domain: String(row.domain),
    scope: row.scope as PolicyTrainingEvent['scope'],
    source: row.source as PolicyTrainingEvent['source'],
    resultId: String(row.resultId),
    outcome: row.outcome as PolicyTrainingEvent['outcome'],
    observedAt: dateString(row.observedAt),
    actorId: typeof row.actorIdHash === 'string' ? `sha256:${row.actorIdHash}` : undefined,
    policyPackId: stringOrUndefined(row.policyPackId),
    quality: row.quality as PolicyTrainingEvent['quality'],
    features: row.features as PolicyTrainingEvent['features'],
    labels: row.labels as PolicyTrainingEvent['labels'],
    notes: stringOrUndefined(row.notes),
    metadata: row.metadata as PolicyTrainingEvent['metadata'],
  };
}

export function policyPackToRow(pack: PolicyPack): JsonRecord {
  return compact({
    id: pack.id,
    domain: pack.domain,
    version: pack.version,
    maturityStage: pack.maturityStage,
    status: pack.status,
    marketId: pack.marketId,
    qualityPolicy: pack.qualityPolicy,
    validationProfileId: pack.validationProfileId,
    metadata: redactJson(pack.metadata),
    createdAt: new Date(pack.createdAt),
    activatedAt: pack.activatedAt ? new Date(pack.activatedAt) : undefined,
  });
}

export function rowToPolicyPack(row: JsonRecord): PolicyPack {
  return {
    id: String(row.id),
    domain: String(row.domain),
    version: String(row.version),
    maturityStage: String(row.maturityStage),
    status: row.status as PolicyPack['status'],
    marketId: stringOrUndefined(row.marketId),
    qualityPolicy: row.qualityPolicy as PolicyPack['qualityPolicy'],
    validationProfileId: stringOrUndefined(row.validationProfileId),
    createdAt: dateString(row.createdAt),
    activatedAt: row.activatedAt ? dateString(row.activatedAt) : undefined,
    metadata: row.metadata as PolicyPack['metadata'],
  };
}

export function evaluationToRow(result: PolicyEvaluationResult): JsonRecord {
  return {
    datasetId: result.datasetId,
    currentPolicyPackId: result.currentPolicyPackId,
    candidatePolicyPackId: result.candidatePolicyPackId,
    status: result.status,
    metrics: result.metrics,
    gates: result.gates,
    regressionCaseIds: result.regressionCaseIds,
    evaluatedAt: new Date(result.evaluatedAt),
  };
}

export function rowToEvaluation(row: JsonRecord): PolicyEvaluationResult {
  return {
    datasetId: String(row.datasetId),
    currentPolicyPackId: String(row.currentPolicyPackId),
    candidatePolicyPackId: String(row.candidatePolicyPackId),
    status: row.status as PolicyEvaluationResult['status'],
    metrics: row.metrics as PolicyEvaluationResult['metrics'],
    gates: row.gates as PolicyEvaluationResult['gates'],
    regressionCaseIds: Array.isArray(row.regressionCaseIds)
      ? row.regressionCaseIds.map(String)
      : [],
    evaluatedAt: dateString(row.evaluatedAt),
  };
}

export function compact(input: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

function actorHash(actorId: string): string {
  return createHash('sha256').update(actorId).digest('hex');
}

const SENSITIVE_KEYS = new Set(['actorId', 'userId', 'email', 'note', 'notes', 'resolvedBy']);

function redactJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => !SENSITIVE_KEYS.has(key))
      .map(([key, nested]) => [key, redactJson(nested)]),
  );
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function dateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}
