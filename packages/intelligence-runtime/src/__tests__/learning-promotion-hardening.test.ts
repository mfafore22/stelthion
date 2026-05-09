import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryLearningPort } from '../learning-store.js';
import { activateShadowPolicy } from '../learning-promotion.js';
import type { PolicyEvaluationResult, PolicyPack } from '../learning-types.js';

test('activation rejects stale passing evaluations by default', async () => {
  const port = new InMemoryLearningPort();
  await port.putPolicyPack(pack('candidate', 'shadow'));
  await port.recordEvaluation(evaluation('2026-03-01T11:00:00.000Z'));

  await assert.rejects(() =>
    activateShadowPolicy({
      port,
      candidatePolicyPackId: 'candidate',
      activatedAt: '2026-05-08T12:00:00.000Z',
    }),
  /fresh shadow evaluation/);
});

test('activation records evaluation reference and peer retirement time', async () => {
  const port = new InMemoryLearningPort();
  await port.putPolicyPack(pack('current', 'active'));
  await port.putPolicyPack(pack('candidate', 'shadow'));
  await port.recordEvaluation(evaluation('2026-05-08T11:00:00.000Z'));

  const active = await activateShadowPolicy({
    port,
    candidatePolicyPackId: 'candidate',
    activatedAt: '2026-05-08T12:00:00.000Z',
  });
  const current = await port.getPolicyPack('current');
  const ref = active.metadata?.activatedByEvaluation as { datasetId?: string } | undefined;

  assert.equal(ref?.datasetId, 'dataset-1');
  assert.equal(current?.metadata?.retiredAt, '2026-05-08T12:00:00.000Z');
});

test('keepActivePeers opts into retaining active peers', async () => {
  const port = new InMemoryLearningPort();
  await port.putPolicyPack(pack('current', 'active'));
  await port.putPolicyPack(pack('candidate', 'shadow'));
  await port.recordEvaluation(evaluation('2026-05-08T11:00:00.000Z'));

  await activateShadowPolicy({
    port,
    candidatePolicyPackId: 'candidate',
    keepActivePeers: true,
    activatedAt: '2026-05-08T12:00:00.000Z',
  });

  assert.equal((await port.getPolicyPack('current'))?.status, 'active');
});

function pack(id: string, status: PolicyPack['status']): PolicyPack {
  return {
    id,
    domain: 'shoppermind',
    version: id,
    maturityStage: 'controlled',
    marketId: 'helsinki-fi',
    status,
    createdAt: '2026-05-08T09:00:00.000Z',
  };
}

function evaluation(evaluatedAt: string): PolicyEvaluationResult {
  return {
    datasetId: 'dataset-1',
    currentPolicyPackId: 'current',
    candidatePolicyPackId: 'candidate',
    status: 'pass',
    metrics: { accuracy: 1, weightedAccuracy: 1, currentAccuracy: 0.5, regressionRate: 0, coverage: 1 },
    gates: [],
    regressionCaseIds: [],
    evaluatedAt,
  };
}
