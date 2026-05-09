import { describe, expect, it } from 'vitest';
import { PrismaLearningPort, type LearningClient } from '../engine/learning/prisma-learning-port.js';
import type { JsonRecord } from '../engine/learning/prisma-learning-codec.js';
import type { PolicyPack } from '@stelthion/intelligence-runtime';

describe('PrismaLearningPort policy pack writes', () => {
  it('rejects active policy writes without a stored passing evaluation', async () => {
    const port = new PrismaLearningPort(fakeLearningClient());

    await expect(port.putPolicyPack(pack('active'))).rejects.toThrow(
      /evaluation reference/,
    );
  });

  it('allows active policy writes with a fresh stored passing evaluation', async () => {
    const client = fakeLearningClient([evaluationRow()]);
    const port = new PrismaLearningPort(client);

    const saved = await port.putPolicyPack(pack('active', {
      activatedAt: '2026-05-08T12:00:00.000Z',
      metadata: {
        activatedByEvaluation: {
          datasetId: 'dataset-1',
          evaluatedAt: '2026-05-08T11:00:00.000Z',
        },
      },
    }));

    expect(saved.status).toBe('active');
  });

  it('rejects active policy writes with stale evaluation evidence', async () => {
    const port = new PrismaLearningPort(fakeLearningClient([evaluationRow({
      evaluatedAt: new Date('2026-03-01T11:00:00.000Z'),
    })]));

    await expect(port.putPolicyPack(pack('active', {
      activatedAt: '2026-05-08T12:00:00.000Z',
      metadata: {
        activatedByEvaluation: {
          datasetId: 'dataset-1',
          evaluatedAt: '2026-03-01T11:00:00.000Z',
        },
      },
    }))).rejects.toThrow(/fresh evaluation/);
  });
});

function pack(status: PolicyPack['status'], patch: Partial<PolicyPack> = {}): PolicyPack {
  return {
    id: 'candidate',
    domain: 'shoppermind',
    version: 'candidate',
    maturityStage: 'controlled',
    marketId: 'helsinki-fi',
    status,
    createdAt: '2026-05-08T09:00:00.000Z',
    ...patch,
  };
}

function evaluationRow(patch: JsonRecord = {}): JsonRecord {
  return {
    datasetId: 'dataset-1',
    currentPolicyPackId: 'current',
    candidatePolicyPackId: 'candidate',
    status: 'pass',
    metrics: {},
    gates: [],
    regressionCaseIds: [],
    evaluatedAt: new Date('2026-05-08T11:00:00.000Z'),
    ...patch,
  };
}

function fakeLearningClient(evaluations: JsonRecord[] = []): LearningClient {
  return {
    policyTrainingEvent: emptyTrainingDelegate(),
    policyPackRecord: {
      async upsert(args) { return { ...args.create, createdAt: args.create.createdAt }; },
      async findUnique() { return null; },
      async findMany() { return []; },
    },
    policyEvaluationResultRecord: {
      async create({ data }) { evaluations.push(data); return data; },
      async findMany() { return evaluations; },
    },
  };
}

function emptyTrainingDelegate() {
  return {
    async create({ data }: { data: JsonRecord }) { return data; },
    async findMany() { return []; },
    async updateMany() { return { count: 0 }; },
    async deleteMany() { return { count: 0 }; },
  };
}
