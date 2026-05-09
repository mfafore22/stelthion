import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createShopperMindAgentRegistry } from '../engine/agents/registry.js';
import { interactionToPolicyTrainingEvent } from '../engine/learning/policy-events.js';
import {
  AgentRouteDecisionContract,
  PolicyTrainingEventContract,
  TrainingNdjsonContract,
} from './phase-6-contract-schemas.js';

const findMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({ reviewItem: { findMany } }),
}));

const { streamPolicyTrainingEvents, streamTrainingRecords } =
  await import('../engine/insights/training-export.js');

describe('Phase 6.1b contracts', () => {
  beforeEach(() => findMany.mockReset());

  it('pins learning NDJSON export and policy-event shapes', async () => {
    findMany.mockResolvedValueOnce([reviewRow()]);
    const [record] = await collect(streamTrainingRecords({ marketId: 'helsinki-fi' }));
    const ndjsonRecord = JSON.parse(`${JSON.stringify(record)}\n`);

    expect(() => TrainingNdjsonContract.parse(ndjsonRecord)).not.toThrow();

    findMany.mockReset();
    findMany.mockResolvedValueOnce([reviewRow()]);
    const [event] = await collect(streamPolicyTrainingEvents({ marketId: 'helsinki-fi' }));
    const ndjsonEvent = JSON.parse(`${JSON.stringify(event)}\n`);

    expect(() => PolicyTrainingEventContract.parse(ndjsonEvent)).not.toThrow();
    expect(ndjsonEvent.source).toBe('review_outcome');
  });

  it('pins user-feedback policy training event shape', () => {
    const event = interactionToPolicyTrainingEvent({
      id: 'feedback-1',
      userId: 'user-1',
      marketId: 'helsinki-fi',
      phenomenonId: 'phenomenon-1',
      interactionKind: 'thumbs',
      verdict: 'relevant',
      note: 'useful',
      createdAt: '2026-05-08T10:00:00.000Z',
    });

    expect(() => PolicyTrainingEventContract.parse(event)).not.toThrow();
    expect(event.outcome).toBe('accepted');
  });

  it('pins shared agent registry routing output shape', () => {
    const route = createShopperMindAgentRegistry().routeTask({
      domain: 'shoppermind',
      intent: 'analyze_trends',
      taskType: 'analysis',
      prompt: 'Analyze market demand trend signals',
      scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
    });

    expect(() => AgentRouteDecisionContract.parse(route)).not.toThrow();
    expect(route.agentId).toBe('shoppermind.trend_analyst');
  });
});

async function collect<T>(iterator: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const value of iterator) out.push(value);
  return out;
}

function reviewRow() {
  return {
    id: 'review-1',
    marketId: 'helsinki-fi',
    phenomenonId: 'phenomenon-1',
    decision: 'REVIEW',
    status: 'APPROVED',
    reasons: ['needs review'],
    metricsSnapshot: { compositeScore: 0.55, quality: { decision: 'review', handling: 'review_first' } },
    narrativeDraft: 'Draft',
    resolutionNote: 'Looks right',
    resolvedBy: 'admin@example.com',
    resolvedAt: new Date('2026-05-08T10:00:00.000Z'),
    createdAt: new Date('2026-05-08T09:00:00.000Z'),
    phenomenon: {
      label: 'Passive house adoption',
      description: 'Rising interest',
      phenomenonType: 'TREND',
      culturalScope: 'COUNTRY',
      culturalLocality: 'FI',
      footTrafficScope: 'COUNTRY',
      footTrafficLocality: 'FI',
      state: 'EMERGING',
    },
  };
}
