import { describe, it, expect, vi, beforeEach } from 'vitest';

const scoreDeleteMany = vi.fn();
const reviewDeleteMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({
    phenomenonScore: { deleteMany: scoreDeleteMany },
    reviewItem: { deleteMany: reviewDeleteMany },
  }),
}));

const { runRetention } = await import('../engine/retention/retention-service.js');

describe('runRetention', () => {
  beforeEach(() => {
    scoreDeleteMany.mockReset();
    reviewDeleteMany.mockReset();
  });

  it('deletes scores older than scoreRetentionDays and only resolved reviews older than reviewRetentionDays', async () => {
    scoreDeleteMany.mockResolvedValue({ count: 7 });
    reviewDeleteMany.mockResolvedValue({ count: 2 });
    const now = new Date('2026-04-18T00:00:00Z');

    const summary = await runRetention(
      { scoreRetentionDays: 90, reviewRetentionDays: 180 },
      now,
    );

    expect(summary).toMatchObject({ scoresDeleted: 7, reviewsDeleted: 2 });
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);

    const scoreCall = scoreDeleteMany.mock.calls[0][0];
    const expectedScoreCutoff = new Date('2026-01-18T00:00:00Z');
    expect(scoreCall.where.date.lt.getTime()).toBe(expectedScoreCutoff.getTime());

    const reviewCall = reviewDeleteMany.mock.calls[0][0];
    expect(reviewCall.where.status).toEqual({ in: ['APPROVED', 'REJECTED', 'EXPIRED'] });
    expect(reviewCall.where.resolvedAt.not).toBeNull();
    const expectedReviewCutoff = new Date('2025-10-20T00:00:00Z');
    expect(reviewCall.where.resolvedAt.lt.getTime()).toBe(expectedReviewCutoff.getTime());
  });

  it('never prunes PENDING reviews — status filter excludes them', async () => {
    scoreDeleteMany.mockResolvedValue({ count: 0 });
    reviewDeleteMany.mockResolvedValue({ count: 0 });

    await runRetention({ scoreRetentionDays: 30, reviewRetentionDays: 60 });

    const statusFilter = reviewDeleteMany.mock.calls[0][0].where.status;
    expect(statusFilter.in).not.toContain('PENDING');
  });

  it('returns zero counts when both delete operations are no-ops', async () => {
    scoreDeleteMany.mockResolvedValue({ count: 0 });
    reviewDeleteMany.mockResolvedValue({ count: 0 });

    const summary = await runRetention({ scoreRetentionDays: 90, reviewRetentionDays: 180 });

    expect(summary.scoresDeleted).toBe(0);
    expect(summary.reviewsDeleted).toBe(0);
  });
});
