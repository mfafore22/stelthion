import {
  DEFAULT_LEARNING_RETENTION_POLICY,
  assertPolicyTrainingEventScoped,
  type LearningPort,
  type LearningRetentionPolicy,
  type PolicyEvaluationFilter,
  type PolicyEvaluationResult,
  type PolicyPack,
  type PolicyPackFilter,
  type PolicyTrainingEvent,
  type TrainingEventFilter,
} from '@stelthion/intelligence-runtime';
import {
  compact,
  evaluationToRow,
  policyPackToRow,
  rowToEvaluation,
  rowToPolicyPack,
  rowToTrainingEvent,
  trainingEventToRow,
  trainingEventWhere,
  type JsonRecord,
} from './prisma-learning-codec.js';

type CountResult = { count: number };
const ACTIVE_POLICY_EVALUATION_MAX_AGE_DAYS = 30;

export interface LearningClient {
  policyTrainingEvent: {
    create(args: { data: JsonRecord }): Promise<JsonRecord>;
    findMany(args: JsonRecord): Promise<JsonRecord[]>;
    updateMany(args: JsonRecord): Promise<CountResult>;
    deleteMany(args: JsonRecord): Promise<CountResult>;
  };
  policyPackRecord: {
    upsert(args: JsonRecord): Promise<JsonRecord>;
    findUnique(args: JsonRecord): Promise<JsonRecord | null>;
    findMany(args: JsonRecord): Promise<JsonRecord[]>;
  };
  policyEvaluationResultRecord: {
    create(args: { data: JsonRecord }): Promise<JsonRecord>;
    findMany(args: JsonRecord): Promise<JsonRecord[]>;
  };
}

export interface LearningRetentionSummary {
  anonymized: number;
  deleted: number;
}

export class PrismaLearningPort implements LearningPort {
  constructor(
    private client: LearningClient,
    private retention: LearningRetentionPolicy = DEFAULT_LEARNING_RETENTION_POLICY,
  ) {}

  async appendTrainingEvent(event: PolicyTrainingEvent): Promise<PolicyTrainingEvent> {
    assertPolicyTrainingEventScoped(event);
    const row = await this.client.policyTrainingEvent.create({
      data: trainingEventToRow(event, this.retention),
    });
    return rowToTrainingEvent(row);
  }

  async listTrainingEvents(filter: TrainingEventFilter = {}): Promise<PolicyTrainingEvent[]> {
    // Internal callers may list broadly for exports. Non-internal callers must
    // pass a tenant-scoped filter before reaching this port.
    const rows = await this.client.policyTrainingEvent.findMany({
      where: trainingEventWhere(filter),
      orderBy: { observedAt: 'desc' },
      take: filter.limit ?? 1000,
    });
    return rows.map(rowToTrainingEvent);
  }

  async putPolicyPack(pack: PolicyPack): Promise<PolicyPack> {
    if (pack.status === 'active') await this.assertActiveWriteAllowed(pack);
    const row = await this.client.policyPackRecord.upsert({
      where: { id: pack.id },
      create: policyPackToRow(pack),
      update: policyPackToRow(pack),
    });
    return rowToPolicyPack(row);
  }

  async getPolicyPack(id: string): Promise<PolicyPack | null> {
    const row = await this.client.policyPackRecord.findUnique({ where: { id } });
    return row ? rowToPolicyPack(row) : null;
  }

  async listPolicyPacks(filter: PolicyPackFilter = {}): Promise<PolicyPack[]> {
    const rows = await this.client.policyPackRecord.findMany({
      where: compact({
        domain: filter.domain,
        marketId: filter.marketId,
        status: filter.status,
      }),
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 1000,
    });
    return rows.map(rowToPolicyPack);
  }

  async recordEvaluation(result: PolicyEvaluationResult): Promise<PolicyEvaluationResult> {
    const row = await this.client.policyEvaluationResultRecord.create({
      data: evaluationToRow(result),
    });
    return rowToEvaluation(row);
  }

  async listEvaluations(
    filter: PolicyEvaluationFilter = {},
  ): Promise<PolicyEvaluationResult[]> {
    const rows = await this.client.policyEvaluationResultRecord.findMany({
      where: compact({
        candidatePolicyPackId: filter.candidatePolicyPackId,
        status: filter.status,
      }),
      orderBy: { evaluatedAt: 'desc' },
      take: filter.limit ?? 1000,
    });
    return rows.map(rowToEvaluation);
  }

  async pruneExpiredTrainingEvents(now: Date = new Date()): Promise<LearningRetentionSummary> {
    // Keep anonymization before deletion. If this cron stops between queries,
    // the durable state is still privacy-safer: PII is gone, rows can delete later.
    const anonymized = await this.client.policyTrainingEvent.updateMany({
      where: { piiExpiresAt: { lte: now }, anonymizedAt: null },
      data: { actorIdHash: null, notes: null, labels: null, metadata: null, anonymizedAt: now },
    });
    const deleted = await this.client.policyTrainingEvent.deleteMany({
      where: { retentionExpiresAt: { lte: now } },
    });
    return { anonymized: anonymized.count, deleted: deleted.count };
  }

  private async assertActiveWriteAllowed(pack: PolicyPack): Promise<void> {
    const ref = activationReference(pack);
    if (!ref || !pack.activatedAt) {
      throw new Error('Active policy pack writes require an evaluation reference');
    }
    const rows = await this.client.policyEvaluationResultRecord.findMany({
      where: { candidatePolicyPackId: pack.id, status: 'pass' },
      orderBy: { evaluatedAt: 'desc' },
      take: 10,
    });
    const match = rows.map(rowToEvaluation).find((evaluation) =>
      evaluation.datasetId === ref.datasetId &&
      evaluation.evaluatedAt === ref.evaluatedAt);
    if (!match) {
      throw new Error('Active policy pack writes require a stored passing evaluation');
    }
    if (stale(match.evaluatedAt, pack.activatedAt)) {
      throw new Error('Active policy pack writes require a fresh evaluation');
    }
  }
}

function activationReference(pack: PolicyPack): { datasetId: string; evaluatedAt: string } | null {
  const value = pack.metadata?.activatedByEvaluation;
  if (!value || typeof value !== 'object') return null;
  const record = value as JsonRecord;
  if (typeof record.datasetId !== 'string' || typeof record.evaluatedAt !== 'string') return null;
  return { datasetId: record.datasetId, evaluatedAt: record.evaluatedAt };
}

function stale(evaluatedAt: string, activatedAt: string): boolean {
  const ageMs = Date.parse(activatedAt) - Date.parse(evaluatedAt);
  return ageMs > ACTIVE_POLICY_EVALUATION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}
