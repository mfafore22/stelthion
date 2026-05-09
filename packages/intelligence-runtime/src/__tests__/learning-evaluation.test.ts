import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activatePolicyPack,
  canActivatePolicyPack,
  evaluatePolicyCandidate,
} from '../learning-evaluation.js';
import type { EvaluationDataset, PolicyPack, PolicyPrediction } from '../learning-types.js';

const dataset: EvaluationDataset = {
  id: 'eval-helsinki-1',
  domain: 'shoppermind',
  marketId: 'helsinki-fi',
  createdAt: '2026-05-08T09:00:00Z',
  cases: [
    { id: 'case-1', expectedDecision: 'publish', features: {}, weight: 2 },
    { id: 'case-2', expectedDecision: 'review', features: {}, weight: 1 },
  ],
};

test('evaluatePolicyCandidate blocks promotion when candidate regresses', () => {
  const result = evaluatePolicyCandidate({
    dataset,
    currentPredictions: predictions('current', ['publish', 'review']),
    candidatePredictions: predictions('candidate', ['reject', 'review']),
    gates: [{ metric: 'regression_rate', max: 0 }],
    evaluatedAt: '2026-05-08T10:00:00Z',
  });

  assert.equal(result.status, 'fail');
  assert.deepEqual(result.regressionCaseIds, ['case-1']);
  assert.equal(result.gates[0]?.passed, false);
});

test('activatePolicyPack requires a shadow pack and passing evaluation', () => {
  const result = evaluatePolicyCandidate({
    dataset,
    currentPredictions: predictions('current', ['review', 'review']),
    candidatePredictions: predictions('candidate', ['publish', 'review']),
    gates: [{ metric: 'accuracy', min: 1 }],
  });
  const pack: PolicyPack = {
    id: 'candidate',
    domain: 'shoppermind',
    version: '2026.05.08',
    maturityStage: 'controlled',
    status: 'shadow',
    createdAt: '2026-05-08T09:00:00Z',
  };

  assert.equal(canActivatePolicyPack(pack, result), true);
  const active = activatePolicyPack(pack, result, '2026-05-08T12:00:00Z');
  assert.equal(active.status, 'active');
  assert.equal(active.activatedAt, '2026-05-08T12:00:00Z');
});

function predictions(policyPackId: string, decisions: string[]): PolicyPrediction[] {
  return decisions.map((decision, index) => ({
    caseId: dataset.cases[index]!.id,
    policyPackId,
    decision: decision as PolicyPrediction['decision'],
    reasons: ['fixture'],
  }));
}
