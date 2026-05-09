import { prisma } from '../../db/prisma.js';
import { getCoordinatorQueue } from '../../worker/queues.js';
import { apiMetricsSnapshot } from './api-metrics.js';
import { cacheMetricsSnapshot } from './cache-metrics.js';
import { llmToolMetricsSnapshot } from './llm-metrics.js';

export async function buildObservabilitySnapshot(now: Date = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [queueDepth, runDuration, failedFetches, publishRatio, reviewSla, cache] =
    await Promise.all([
      readQueueDepth(),
      readRunDuration(),
      readFailedSourceFetches(since),
      readPublishRatio(since),
      readReviewSla(since),
      cacheMetricsSnapshot(),
    ]);

  return {
    observedAt: now.toISOString(),
    queueDepth,
    runDuration,
    failedSourceFetches24h: failedFetches,
    publishRatio24h: publishRatio,
    reviewSla24h: reviewSla,
    cache,
    api: apiMetricsSnapshot(),
    llmToolErrors: llmToolMetricsSnapshot(),
  };
}

async function readQueueDepth() {
  try {
    const counts = await getCoordinatorQueue().getJobCounts('waiting', 'delayed', 'active');
    return { status: 'ok', ...counts };
  } catch {
    return { status: 'unavailable' };
  }
}

async function readRunDuration() {
  const rows = await prisma().coordinatorRun.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { finishedAt: 'desc' },
    take: 20,
    select: { startedAt: true, finishedAt: true },
  });
  const values = rows.map((row) => row.finishedAt!.getTime() - row.startedAt.getTime());
  return averageMetric(values);
}

async function readFailedSourceFetches(since: Date): Promise<number> {
  return prisma().ingestionRun.count({
    where: { startedAt: { gte: since }, status: 'error' },
  });
}

async function readPublishRatio(since: Date) {
  const rows = await prisma().reviewItem.groupBy({
    by: ['decision'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const total = rows.reduce((sum, row) => sum + row._count._all, 0);
  const published = rows.find((row) => row.decision === 'PUBLISH')?._count._all ?? 0;
  return { published, total, ratio: total > 0 ? published / total : null };
}

async function readReviewSla(since: Date) {
  const rows = await prisma().reviewItem.findMany({
    where: { resolvedAt: { not: null, gte: since } },
    select: { createdAt: true, resolvedAt: true },
    take: 200,
  });
  const values = rows.map((row) => row.resolvedAt!.getTime() - row.createdAt.getTime());
  return averageMetric(values);
}

function averageMetric(values: number[]) {
  const count = values.length;
  const avgMs = count > 0 ? values.reduce((sum, value) => sum + value, 0) / count : null;
  return { count, avgMs };
}
