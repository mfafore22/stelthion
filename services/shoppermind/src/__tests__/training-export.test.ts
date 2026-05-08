import { describe, it, expect, vi, beforeEach } from 'vitest';

const findMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({ reviewItem: { findMany } }),
}));

const { streamTrainingRecords } = await import('../engine/insights/training-export.js');

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ri_1',
    marketId: 'helsinki-fi',
    phenomenonId: 'p1',
    decision: 'REVIEW',
    status: 'APPROVED',
    reasons: ['composite 0.55 in [0.4, 0.6)'],
    metricsSnapshot: { compositeScore: 0.55 },
    narrativeDraft: 'draft',
    resolutionNote: 'looks right',
    resolvedBy: 'admin@example.com',
    resolvedAt: new Date('2026-04-18T10:00:00Z'),
    createdAt: new Date('2026-04-18T09:00:00Z'),
    phenomenon: {
      label: 'Passive house adoption',
      description: 'Discourse...',
      phenomenonType: 'TREND',
      culturalScope: 'COUNTRY',
      culturalLocality: 'FI',
      footTrafficScope: 'COUNTRY',
      footTrafficLocality: 'FI',
      state: 'EMERGING',
    },
    ...overrides,
  };
}

async function collect<T>(it: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const v of it) out.push(v);
  return out;
}

describe('streamTrainingRecords', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('defaults to resolved statuses, emits one record per ReviewItem', async () => {
    findMany.mockResolvedValueOnce([row({ id: 'a', status: 'APPROVED' }), row({ id: 'b', status: 'REJECTED' })]);
    findMany.mockResolvedValueOnce([]);

    const records = await collect(streamTrainingRecords({}));

    expect(records).toHaveLength(2);
    expect(records[0]!.reviewerAction).toBe('APPROVED');
    expect(records[1]!.reviewerAction).toBe('REJECTED');

    const where = findMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ['APPROVED', 'REJECTED', 'EXPIRED'] });
    expect(where.marketId).toBeUndefined();
  });

  it('filters by marketId and respects hard limit', async () => {
    findMany.mockResolvedValueOnce([row({ id: 'a' }), row({ id: 'b' }), row({ id: 'c' })]);

    const records = await collect(streamTrainingRecords({ marketId: 'helsinki-fi', limit: 2 }));

    expect(records).toHaveLength(2);
    expect(findMany.mock.calls[0][0].where.marketId).toBe('helsinki-fi');
  });

  it('paginates via cursor when a full page is returned', async () => {
    // First call returns a full page of 500 so the generator must request another batch.
    const fullPage = Array.from({ length: 500 }, (_, i) => row({ id: `r${i}` }));
    findMany.mockResolvedValueOnce(fullPage);
    findMany.mockResolvedValueOnce([]);

    const records = await collect(streamTrainingRecords({}));
    expect(records).toHaveLength(500);
    expect(findMany).toHaveBeenCalledTimes(2);
    // second call uses cursor + skip
    const secondCall = findMany.mock.calls[1][0];
    expect(secondCall.cursor).toEqual({ id: 'r499' });
    expect(secondCall.skip).toBe(1);
  });

  it('maps PENDING status to null reviewerAction when explicitly requested', async () => {
    findMany.mockResolvedValueOnce([row({ status: 'PENDING' })]);
    findMany.mockResolvedValueOnce([]);

    const records = await collect(streamTrainingRecords({ status: ['PENDING'] }));
    expect(records[0]!.reviewerAction).toBeNull();
  });
});
