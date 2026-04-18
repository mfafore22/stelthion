import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  prisma: () => ({ reviewItem: { updateMany } }),
}));

const { expireReviewItems } = await import('../engine/review/review-service.js');

describe('expireReviewItems', () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it('expires only PENDING items whose ttlExpiresAt has elapsed', async () => {
    updateMany.mockResolvedValue({ count: 3 });
    const now = new Date('2026-04-18T12:00:00Z');

    const summary = await expireReviewItems(now);

    expect(summary.expired).toBe(3);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
    expect(updateMany).toHaveBeenCalledTimes(1);

    const call = updateMany.mock.calls[0][0];
    expect(call.where).toEqual({
      status: 'PENDING',
      ttlExpiresAt: { not: null, lte: now },
    });
    expect(call.data).toEqual({
      status: 'EXPIRED',
      resolvedAt: now,
      appliedAction: 'EXPIRED',
    });
  });

  it('returns zero when nothing is due and is safe to call repeatedly', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    const first = await expireReviewItems();
    const second = await expireReviewItems();

    expect(first.expired).toBe(0);
    expect(second.expired).toBe(0);
    expect(updateMany).toHaveBeenCalledTimes(2);
  });
});
