import {
  activatePolicyPack,
  evaluatePolicyCandidate,
  type EvaluatePolicyCandidateInput,
} from './learning-evaluation.js';
import type { LearningPort } from './learning-store.js';
import type { PolicyEvaluationResult, PolicyPack } from './learning-types.js';

export interface StartShadowInput {
  port: LearningPort;
  candidatePolicyPackId: string;
  shadowedAt?: string;
}

export interface RecordShadowEvaluationInput extends EvaluatePolicyCandidateInput {
  port: LearningPort;
}

export interface ActivateShadowInput {
  port: LearningPort;
  candidatePolicyPackId: string;
  evaluation?: PolicyEvaluationResult;
  activatedAt?: string;
  keepActivePeers?: boolean;
  retireCurrentActive?: boolean;
  maxEvaluationAgeDays?: number | null;
}

export const DEFAULT_POLICY_EVALUATION_MAX_AGE_DAYS = 30;

export async function startPolicyShadow(input: StartShadowInput): Promise<PolicyPack> {
  const pack = await requirePolicyPack(input.port, input.candidatePolicyPackId);
  if (pack.status !== 'draft') {
    throw new Error('Only draft policy packs can enter shadow evaluation');
  }
  return input.port.putPolicyPack({
    ...pack,
    status: 'shadow',
    metadata: { ...pack.metadata, shadowedAt: input.shadowedAt ?? new Date().toISOString() },
  });
}

export async function recordShadowEvaluation(
  input: RecordShadowEvaluationInput,
): Promise<PolicyEvaluationResult> {
  const candidateId = commonPolicyPackId(input.candidatePredictions);
  const candidate = await requirePolicyPack(input.port, candidateId);
  if (candidate.status !== 'shadow') {
    throw new Error('Shadow evaluation requires a candidate pack in shadow status');
  }
  const result = evaluatePolicyCandidate(input);
  return input.port.recordEvaluation(result);
}

export async function activateShadowPolicy(input: ActivateShadowInput): Promise<PolicyPack> {
  const pack = await requirePolicyPack(input.port, input.candidatePolicyPackId);
  const evaluation = input.evaluation ?? await latestPassingEvaluation(
    input.port,
    input.candidatePolicyPackId,
  );
  if (!evaluation) {
    throw new Error('Policy activation requires a passing shadow evaluation');
  }
  assertEvaluationFresh(evaluation, input.activatedAt, input.maxEvaluationAgeDays);

  const active = markActivation(activatePolicyPack(pack, evaluation, input.activatedAt), evaluation);
  if (shouldRetireActivePeers(input)) {
    await retireActivePeers(input.port, active);
  }
  return input.port.putPolicyPack(active);
}

async function latestPassingEvaluation(
  port: LearningPort,
  candidatePolicyPackId: string,
): Promise<PolicyEvaluationResult | null> {
  const evaluations = await port.listEvaluations({ candidatePolicyPackId, status: 'pass' });
  return evaluations.sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0] ?? null;
}

async function retireActivePeers(port: LearningPort, active: PolicyPack): Promise<void> {
  const peers = await port.listPolicyPacks({
    domain: active.domain,
    marketId: active.marketId,
    status: 'active',
  });
  await Promise.all(peers
    .filter((peer) => peer.id !== active.id && peer.marketId === active.marketId)
    .map((peer) => port.putPolicyPack({
      ...peer,
      status: 'retired',
      metadata: {
        ...peer.metadata,
        retiredByPolicyPackId: active.id,
        retiredAt: active.activatedAt ?? new Date().toISOString(),
      },
    })));
}

function markActivation(
  pack: PolicyPack,
  evaluation: PolicyEvaluationResult,
): PolicyPack {
  return {
    ...pack,
    metadata: {
      ...pack.metadata,
      activatedByEvaluation: {
        datasetId: evaluation.datasetId,
        evaluatedAt: evaluation.evaluatedAt,
        currentPolicyPackId: evaluation.currentPolicyPackId,
      },
    },
  };
}

function shouldRetireActivePeers(input: ActivateShadowInput): boolean {
  if (input.keepActivePeers != null) return !input.keepActivePeers;
  return input.retireCurrentActive ?? true;
}

function assertEvaluationFresh(
  evaluation: PolicyEvaluationResult,
  activatedAt?: string,
  maxAgeDays: number | null = DEFAULT_POLICY_EVALUATION_MAX_AGE_DAYS,
): void {
  if (maxAgeDays == null) return;
  const ageMs = Date.parse(activatedAt ?? new Date().toISOString()) -
    Date.parse(evaluation.evaluatedAt);
  if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
    throw new Error('Policy activation requires a fresh shadow evaluation');
  }
}

async function requirePolicyPack(port: LearningPort, id: string): Promise<PolicyPack> {
  const pack = await port.getPolicyPack(id);
  if (!pack) throw new Error(`Policy pack not found: ${id}`);
  return pack;
}

function commonPolicyPackId(predictions: { policyPackId: string }[]): string {
  const [first] = predictions;
  if (!first) throw new Error('Policy evaluation requires candidate predictions');
  if (predictions.some((prediction) => prediction.policyPackId !== first.policyPackId)) {
    throw new Error('Policy evaluation predictions must use one candidate pack');
  }
  return first.policyPackId;
}
