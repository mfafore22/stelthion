import { describe, it, expect, vi, beforeEach } from 'vitest';

const feedbackCreate = vi.fn();
const feedbackFindMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    phenomenonFeedback: { create: feedbackCreate, findMany: feedbackFindMany },
  }),
}));

const { recordInteraction, summariseInteractions, listFeedback } = await import(
  '../engine/insights/feedback-collector.js'
);

describe('recordInteraction', () => {
  beforeEach(() => {
    feedbackCreate.mockReset();
  });

  it('persists a row with normalized null fields', async () => {
    feedbackCreate.mockResolvedValue({
      id: 'fb1',
      phenomenonId: 'p1',
      marketId: 'helsinki-fi',
      userId: 'u1',
      interactionKind: 'thumbs',
      verdict: 'relevant',
      note: null,
      createdAt: new Date('2026-04-19T09:00:00Z'),
    });

    const row = await recordInteraction({
      phenomenonId: 'p1',
      userId: 'u1',
      marketId: 'helsinki-fi',
      interactionKind: 'thumbs',
      verdict: 'relevant',
    });
    expect(row.note).toBeNull();
    expect(feedbackCreate).toHaveBeenCalledWith({
      data: {
        phenomenonId: 'p1',
        userId: 'u1',
        marketId: 'helsinki-fi',
        interactionKind: 'thumbs',
        verdict: 'relevant',
        note: null,
      },
    });
  });
});

describe('summariseInteractions', () => {
  beforeEach(() => {
    feedbackFindMany.mockReset();
  });

  it('aggregates per-kind totals and resolves positive/negative verdicts', async () => {
    feedbackFindMany.mockResolvedValue([
      { interactionKind: 'thumbs', verdict: 'relevant' },
      { interactionKind: 'thumbs', verdict: 'star' },
      { interactionKind: 'thumbs', verdict: 'not_relevant' },
      { interactionKind: 'click', verdict: 'clicked' },
      { interactionKind: 'click', verdict: 'clicked' },
      { interactionKind: 'dwell', verdict: 'dwell_30s' },
      { interactionKind: 'chat_followup', verdict: 'asked' },
      { interactionKind: 'chat_citation_click', verdict: 'opened' },
    ]);

    const summary = await summariseInteractions(
      'p1',
      'helsinki-fi',
      30,
      new Date('2026-04-19T09:00:00Z'),
    );
    expect(summary.totals).toEqual({
      thumbsUp: 2,
      thumbsDown: 1,
      clicks: 2,
      dwellEvents: 1,
      chatFollowups: 1,
      citationClicks: 1,
    });
  });

  it('scopes query to market + nullMarketId when marketId is given', async () => {
    feedbackFindMany.mockResolvedValue([]);
    await summariseInteractions('p1', 'helsinki-fi', 30);
    const where = feedbackFindMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([{ marketId: 'helsinki-fi' }, { marketId: null }]);
  });
});

describe('listFeedback', () => {
  beforeEach(() => {
    feedbackFindMany.mockReset();
  });

  it('joins phenomenon labels and returns per-trend aggregates', async () => {
    feedbackFindMany.mockResolvedValue([
      {
        id: 'f1',
        phenomenonId: 'p1',
        userId: 'u1',
        marketId: 'helsinki-fi',
        verdict: 'relevant',
        interactionKind: 'thumbs',
        note: 'love it',
        createdAt: new Date('2026-04-19T09:00:00Z'),
        phenomenon: { label: 'Trend One' },
      },
      {
        id: 'f2',
        phenomenonId: 'p1',
        userId: 'u2',
        marketId: 'helsinki-fi',
        verdict: 'not_relevant',
        interactionKind: 'thumbs',
        note: null,
        createdAt: new Date('2026-04-18T09:00:00Z'),
        phenomenon: { label: 'Trend One' },
      },
      {
        id: 'f3',
        phenomenonId: 'p2',
        userId: 'u3',
        marketId: null,
        verdict: 'relevant',
        interactionKind: 'thumbs',
        note: '   ',
        createdAt: new Date('2026-04-17T09:00:00Z'),
        phenomenon: { label: 'Trend Two' },
      },
    ]);

    const result = await listFeedback({ limit: 50 });

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].phenomenonLabel).toBe('Trend One');
    expect(result.rows[2].phenomenonLabel).toBe('Trend Two');

    const p1Agg = result.aggregates.find((a) => a.phenomenonId === 'p1');
    const p2Agg = result.aggregates.find((a) => a.phenomenonId === 'p2');
    expect(p1Agg).toEqual({
      phenomenonId: 'p1',
      phenomenonLabel: 'Trend One',
      relevant: 1,
      notRelevant: 1,
      commentCount: 1,
    });
    expect(p2Agg).toEqual({
      phenomenonId: 'p2',
      phenomenonLabel: 'Trend Two',
      relevant: 1,
      notRelevant: 0,
      commentCount: 0,
    });
  });

  it('forwards filter fields to the prisma where clause', async () => {
    feedbackFindMany.mockResolvedValue([]);
    const since = new Date('2026-04-01T00:00:00Z');
    await listFeedback({
      phenomenonId: 'p9',
      userId: 'u9',
      verdict: 'relevant',
      marketId: 'helsinki-fi',
      since,
      limit: 25,
    });
    const call = feedbackFindMany.mock.calls[0][0];
    expect(call.where).toEqual({
      phenomenonId: 'p9',
      userId: 'u9',
      verdict: 'relevant',
      marketId: 'helsinki-fi',
      createdAt: { gte: since },
    });
    expect(call.take).toBe(25);
    expect(call.include).toEqual({ phenomenon: { select: { label: true } } });
  });

  it('returns empty rows + aggregates when no rows match', async () => {
    feedbackFindMany.mockResolvedValue([]);
    const result = await listFeedback({ limit: 100 });
    expect(result.rows).toEqual([]);
    expect(result.aggregates).toEqual([]);
  });
});
