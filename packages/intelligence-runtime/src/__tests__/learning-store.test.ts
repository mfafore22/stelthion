import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryLearningPort } from '../learning-store.js';

test('InMemoryLearningPort stores training events by domain and market', async () => {
  const port = new InMemoryLearningPort();
  await port.appendTrainingEvent({
    id: 'event-1',
    domain: 'shoppermind',
    scope: { marketId: 'helsinki-fi' },
    source: 'review_outcome',
    resultId: 'result-1',
    outcome: 'accepted',
    observedAt: '2026-05-08T10:00:00Z',
  });
  await port.appendTrainingEvent({
    id: 'event-2',
    domain: 'venuemind',
    scope: { venueId: 'arena-1' },
    source: 'user_feedback',
    resultId: 'result-2',
    outcome: 'rejected',
    observedAt: '2026-05-08T10:00:00Z',
  });

  const helsinki = await port.listTrainingEvents({ marketId: 'helsinki-fi' });
  assert.deepEqual(helsinki.map((event) => event.id), ['event-1']);
});

test('InMemoryLearningPort stores policy packs and evaluation results', async () => {
  const port = new InMemoryLearningPort();
  await port.putPolicyPack({
    id: 'pack-1',
    domain: 'shoppermind',
    version: '2026.05.08',
    maturityStage: 'pilot',
    status: 'shadow',
    createdAt: '2026-05-08T10:00:00Z',
  });
  await port.recordEvaluation({
    datasetId: 'dataset-1',
    currentPolicyPackId: 'pack-0',
    candidatePolicyPackId: 'pack-1',
    status: 'pass',
    metrics: {
      accuracy: 1,
      weightedAccuracy: 1,
      currentAccuracy: 0.5,
      regressionRate: 0,
      coverage: 1,
    },
    gates: [],
    regressionCaseIds: [],
    evaluatedAt: '2026-05-08T11:00:00Z',
  });

  assert.equal((await port.getPolicyPack('pack-1'))?.status, 'shadow');
  assert.equal((await port.listEvaluations({ status: 'pass' })).length, 1);
});

test('InMemoryLearningPort rejects unscoped training events', async () => {
  const port = new InMemoryLearningPort();
  await assert.rejects(() => port.appendTrainingEvent({
    id: 'event-unscoped',
    domain: 'shoppermind',
    scope: {},
    source: 'user_feedback',
    resultId: 'result',
    outcome: 'ignored',
    observedAt: '2026-05-08T10:00:00Z',
  }), /requires scope/);
});
