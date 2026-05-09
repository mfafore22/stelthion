import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryLearningPort } from '../learning-store.js';
import {
  activateShadowPolicy,
  recordShadowEvaluation,
  startPolicyShadow,
} from '../learning-promotion.js';
import type { EvaluationDataset, PolicyPack, PolicyPrediction } from '../learning-types.js';

const dataset: EvaluationDataset = {
  id: 'dataset-1',
  domain: 'shoppermind',
  marketId: 'helsinki-fi',
  createdAt: '2026-05-08T09:00:00Z',
  cases: [
    { id: 'case-1', expectedDecision: 'publish', features: {} },
    { id: 'case-2', expectedDecision: 'review', features: {} },
  ],
};

test('policy promotion requires draft to shadow to passing evaluation to active', async () => {
  const port = new InMemoryLearningPort();
  await port.putPolicyPack(pack('current', 'active'));
  await port.putPolicyPack(pack('candidate', 'draft'));

  const shadow = await startPolicyShadow({
    port,
    candidatePolicyPackId: 'candidate',
    shadowedAt: '2026-05-08T10:00:00Z',
  });
  assert.equal(shadow.status, 'shadow');

  const evaluation = await recordShadowEvaluation({
    port,
    dataset,
    currentPredictions: predictions('current', ['review', 'review']),
    candidatePredictions: predictions('candidate', ['publish', 'review']),
    gates: [{ metric: 'accuracy', min: 1 }],
    evaluatedAt: '2026-05-08T11:00:00Z',
  });
  assert.equal(evaluation.status, 'pass');

  const active = await activateShadowPolicy({
    port,
    candidatePolicyPackId: 'candidate',
    activatedAt: '2026-05-08T12:00:00Z',
  });
  assert.equal(active.status, 'active');
  assert.equal((await port.getPolicyPack('current'))?.status, 'retired');
});

test('policy promotion refuses activation without a passing shadow evaluation', async () => {
  const port = new InMemoryLearningPort();
  await port.putPolicyPack(pack('candidate', 'draft'));
  await startPolicyShadow({ port, candidatePolicyPackId: 'candidate' });

  await assert.rejects(() =>
    activateShadowPolicy({ port, candidatePolicyPackId: 'candidate' }),
  /requires a passing shadow evaluation/);
});

function pack(id: string, status: PolicyPack['status']): PolicyPack {
  return {
    id,
    domain: 'shoppermind',
    version: id,
    maturityStage: 'controlled',
    marketId: 'helsinki-fi',
    status,
    createdAt: '2026-05-08T09:00:00Z',
  };
}

function predictions(policyPackId: string, decisions: string[]): PolicyPrediction[] {
  return decisions.map((decision, index) => ({
    caseId: dataset.cases[index]!.id,
    policyPackId,
    decision: decision as PolicyPrediction['decision'],
    reasons: ['fixture'],
  }));
}
