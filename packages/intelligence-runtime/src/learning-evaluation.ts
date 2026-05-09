import type {
  EvaluationDataset,
  EvaluationGate,
  EvaluationGateResult,
  PolicyEvaluationMetrics,
  PolicyEvaluationResult,
  PolicyPack,
  PolicyPrediction,
} from './learning-types.js';

export const DEFAULT_POLICY_EVALUATION_GATES: EvaluationGate[] = [
  { metric: 'coverage', min: 1 },
  { metric: 'accuracy', min: 0.8 },
  { metric: 'regression_rate', max: 0.05 },
];

export interface EvaluatePolicyCandidateInput {
  dataset: EvaluationDataset;
  currentPredictions: PolicyPrediction[];
  candidatePredictions: PolicyPrediction[];
  gates?: EvaluationGate[];
  evaluatedAt?: string;
}

export function evaluatePolicyCandidate(
  input: EvaluatePolicyCandidateInput,
): PolicyEvaluationResult {
  const gates = input.gates ?? DEFAULT_POLICY_EVALUATION_GATES;
  const current = predictionMap(input.currentPredictions);
  const candidate = predictionMap(input.candidatePredictions);
  const metrics = buildMetrics(input.dataset, current, candidate);
  const gateResults = gates.map((gate) => evaluateGate(gate, metrics));

  return {
    datasetId: input.dataset.id,
    currentPolicyPackId: input.currentPredictions[0]?.policyPackId ?? 'unknown',
    candidatePolicyPackId: input.candidatePredictions[0]?.policyPackId ?? 'unknown',
    status: gateResults.every((gate) => gate.passed) ? 'pass' : 'fail',
    metrics,
    gates: gateResults,
    regressionCaseIds: regressionCaseIds(input.dataset, current, candidate),
    evaluatedAt: input.evaluatedAt ?? new Date().toISOString(),
  };
}

export function canActivatePolicyPack(
  pack: PolicyPack,
  result: PolicyEvaluationResult,
): boolean {
  return (
    pack.status === 'shadow' &&
    pack.id === result.candidatePolicyPackId &&
    result.status === 'pass'
  );
}

export function activatePolicyPack(
  pack: PolicyPack,
  result: PolicyEvaluationResult,
  activatedAt: string = new Date().toISOString(),
): PolicyPack {
  if (!canActivatePolicyPack(pack, result)) {
    throw new Error('Policy pack activation requires passing shadow evaluation');
  }
  return { ...pack, status: 'active', activatedAt };
}

function buildMetrics(
  dataset: EvaluationDataset,
  current: Map<string, PolicyPrediction>,
  candidate: Map<string, PolicyPrediction>,
): PolicyEvaluationMetrics {
  const total = Math.max(dataset.cases.length, 1);
  let correct = 0;
  let currentCorrect = 0;
  let weightedCorrect = 0;
  let totalWeight = 0;

  for (const item of dataset.cases) {
    const weight = item.weight ?? 1;
    totalWeight += weight;
    if (candidate.get(item.id)?.decision === item.expectedDecision) {
      correct++;
      weightedCorrect += weight;
    }
    if (current.get(item.id)?.decision === item.expectedDecision) currentCorrect++;
  }

  return {
    accuracy: correct / total,
    weightedAccuracy: weightedCorrect / Math.max(totalWeight, 1),
    currentAccuracy: currentCorrect / total,
    regressionRate: regressionCaseIds(dataset, current, candidate).length / total,
    coverage: candidate.size / total,
  };
}

function evaluateGate(
  gate: EvaluationGate,
  metrics: PolicyEvaluationMetrics,
): EvaluationGateResult {
  const value = metricValue(gate.metric, metrics);
  const passedMin = gate.min == null || value >= gate.min;
  const passedMax = gate.max == null || value <= gate.max;
  return { ...gate, value, passed: passedMin && passedMax };
}

function metricValue(
  metric: EvaluationGate['metric'],
  metrics: PolicyEvaluationMetrics,
): number {
  if (metric === 'weighted_accuracy') return metrics.weightedAccuracy;
  if (metric === 'regression_rate') return metrics.regressionRate;
  return metrics[metric];
}

function predictionMap(predictions: PolicyPrediction[]): Map<string, PolicyPrediction> {
  return new Map(predictions.map((prediction) => [prediction.caseId, prediction]));
}

function regressionCaseIds(
  dataset: EvaluationDataset,
  current: Map<string, PolicyPrediction>,
  candidate: Map<string, PolicyPrediction>,
): string[] {
  return dataset.cases
    .filter((item) =>
      current.get(item.id)?.decision === item.expectedDecision &&
      candidate.get(item.id)?.decision !== item.expectedDecision)
    .map((item) => item.id);
}
