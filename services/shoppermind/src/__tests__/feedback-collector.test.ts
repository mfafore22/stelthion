import { describe, it, expect, vi, beforeEach } from 'vitest';

const feedbackCreate = vi.fn();
const feedbackFindMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    phenomenonFeedback: { create: feedbackCreate, findMany: feedbackFindMany },
  }),
}));

const { recordInteraction, summariseInteractions } = await import(
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
