import type {
  PolicyEvaluationResult,
  PolicyPack,
  PolicyPackStatus,
  PolicyTrainingEvent,
  PolicyTrainingSource,
} from './learning-types.js';

export interface TrainingEventFilter {
  domain?: string;
  marketId?: string;
  source?: PolicyTrainingSource;
  since?: string;
  until?: string;
  limit?: number;
}

export interface PolicyPackFilter {
  domain?: string;
  marketId?: string;
  status?: PolicyPackStatus;
  limit?: number;
}

export interface PolicyEvaluationFilter {
  candidatePolicyPackId?: string;
  status?: 'pass' | 'fail';
  limit?: number;
}

export interface LearningPort {
  appendTrainingEvent(event: PolicyTrainingEvent): Promise<PolicyTrainingEvent>;
  /**
   * Reads may be intentionally broad for internal export and evaluation jobs.
   * Non-internal callers must enforce tenant scope before calling this method.
   */
  listTrainingEvents(filter?: TrainingEventFilter): Promise<PolicyTrainingEvent[]>;
  putPolicyPack(pack: PolicyPack): Promise<PolicyPack>;
  getPolicyPack(id: string): Promise<PolicyPack | null>;
  listPolicyPacks(filter?: PolicyPackFilter): Promise<PolicyPack[]>;
  recordEvaluation(result: PolicyEvaluationResult): Promise<PolicyEvaluationResult>;
  listEvaluations(filter?: PolicyEvaluationFilter): Promise<PolicyEvaluationResult[]>;
}

export class InMemoryLearningPort implements LearningPort {
  private trainingEvents: PolicyTrainingEvent[] = [];
  private policyPacks = new Map<string, PolicyPack>();
  private evaluations: PolicyEvaluationResult[] = [];

  async appendTrainingEvent(event: PolicyTrainingEvent): Promise<PolicyTrainingEvent> {
    assertPolicyTrainingEventScoped(event);
    const stored = clone(event);
    this.trainingEvents.push(stored);
    return clone(stored);
  }

  async listTrainingEvents(filter: TrainingEventFilter = {}): Promise<PolicyTrainingEvent[]> {
    return this.trainingEvents
      .filter((event) => trainingEventMatches(event, filter))
      .slice(0, filter.limit ?? this.trainingEvents.length)
      .map(clone);
  }

  async putPolicyPack(pack: PolicyPack): Promise<PolicyPack> {
    const stored = clone(pack);
    this.policyPacks.set(pack.id, stored);
    return clone(stored);
  }

  async getPolicyPack(id: string): Promise<PolicyPack | null> {
    const pack = this.policyPacks.get(id);
    return pack ? clone(pack) : null;
  }

  async listPolicyPacks(filter: PolicyPackFilter = {}): Promise<PolicyPack[]> {
    const packs = Array.from(this.policyPacks.values()).filter((pack) =>
      policyPackMatches(pack, filter));
    return packs.slice(0, filter.limit ?? packs.length).map(clone);
  }

  async recordEvaluation(result: PolicyEvaluationResult): Promise<PolicyEvaluationResult> {
    const stored = clone(result);
    this.evaluations.push(stored);
    return clone(stored);
  }

  async listEvaluations(
    filter: PolicyEvaluationFilter = {},
  ): Promise<PolicyEvaluationResult[]> {
    return this.evaluations
      .filter((result) => evaluationMatches(result, filter))
      .slice(0, filter.limit ?? this.evaluations.length)
      .map(clone);
  }
}

export function assertPolicyTrainingEventScoped(event: PolicyTrainingEvent): void {
  const scope = event.scope;
  if (!scope.customerId && !scope.marketId && !scope.propertyId && !scope.venueId) {
    throw new Error(`Policy training event requires scope: ${event.id}`);
  }
}

function trainingEventMatches(
  event: PolicyTrainingEvent,
  filter: TrainingEventFilter,
): boolean {
  if (filter.domain && event.domain !== filter.domain) return false;
  if (filter.marketId && event.scope.marketId !== filter.marketId) return false;
  if (filter.source && event.source !== filter.source) return false;
  if (filter.since && event.observedAt < filter.since) return false;
  if (filter.until && event.observedAt > filter.until) return false;
  return true;
}

function policyPackMatches(pack: PolicyPack, filter: PolicyPackFilter): boolean {
  if (filter.domain && pack.domain !== filter.domain) return false;
  if (filter.marketId && pack.marketId !== filter.marketId) return false;
  if (filter.status && pack.status !== filter.status) return false;
  return true;
}

function evaluationMatches(
  result: PolicyEvaluationResult,
  filter: PolicyEvaluationFilter,
): boolean {
  if (filter.status && result.status !== filter.status) return false;
  if (
    filter.candidatePolicyPackId &&
    result.candidatePolicyPackId !== filter.candidatePolicyPackId
  ) {
    return false;
  }
  return true;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
