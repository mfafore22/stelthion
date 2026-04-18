import { prisma } from '../../db/prisma.js';

export interface RetentionSummary {
  scoresDeleted: number;
  reviewsDeleted: number;
  durationMs: number;
}

export interface RetentionConfig {
  scoreRetentionDays: number;
  reviewRetentionDays: number;
}

function daysAgo(now: Date, days: number): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * Delete PhenomenonScore rows older than `scoreRetentionDays` and resolved
 * ReviewItems (APPROVED / REJECTED / EXPIRED) older than `reviewRetentionDays`.
 * PENDING reviews are never pruned here — the TTL sweep is responsible for
 * resolving them first. Idempotent; safe to run on a cron.
 */
export async function runRetention(
  config: RetentionConfig,
  now: Date = new Date(),
): Promise<RetentionSummary> {
  const start = Date.now();
  const scoreCutoff = daysAgo(now, config.scoreRetentionDays);
  const reviewCutoff = daysAgo(now, config.reviewRetentionDays);

  const [scores, reviews] = await Promise.all([
    prisma().phenomenonScore.deleteMany({
      where: { date: { lt: scoreCutoff } },
    }),
    prisma().reviewItem.deleteMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED', 'EXPIRED'] },
        resolvedAt: { not: null, lt: reviewCutoff },
      },
    }),
  ]);

  return {
    scoresDeleted: scores.count,
    reviewsDeleted: reviews.count,
    durationMs: Date.now() - start,
  };
}
