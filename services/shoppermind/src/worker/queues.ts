import { Queue, type JobsOptions } from 'bullmq';
import { redis } from '../db/redis.js';

export const COORDINATOR_QUEUE = 'shoppermind:coordinator';
export const REVIEW_TTL_QUEUE = 'shoppermind:review-ttl';
export const REVIEW_TTL_JOB_NAME = 'expire';
export const REVIEW_TTL_REPEAT_KEY = 'review-ttl-repeat';
export const RETENTION_QUEUE = 'shoppermind:retention';
export const RETENTION_JOB_NAME = 'prune';
export const RETENTION_REPEAT_KEY = 'retention-repeat';

export type CoordinatorJobData = {
  stages?: Array<'ingest' | 'cluster' | 'score' | 'publish'>;
  markets?: string[];
};

export type ReviewTtlJobData = Record<string, never>;

export type RetentionJobData = Record<string, never>;

let coordinatorQueue: Queue<CoordinatorJobData> | null = null;
let reviewTtlQueue: Queue<ReviewTtlJobData> | null = null;
let retentionQueue: Queue<RetentionJobData> | null = null;

export function getCoordinatorQueue(): Queue<CoordinatorJobData> {
  if (coordinatorQueue) return coordinatorQueue;
  coordinatorQueue = new Queue<CoordinatorJobData>(COORDINATOR_QUEUE, {
    connection: redis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 7 * 24 * 3600, count: 500 },
      removeOnFail: { age: 30 * 24 * 3600 },
    },
  });
  return coordinatorQueue;
}

export function getReviewTtlQueue(): Queue<ReviewTtlJobData> {
  if (reviewTtlQueue) return reviewTtlQueue;
  reviewTtlQueue = new Queue<ReviewTtlJobData>(REVIEW_TTL_QUEUE, {
    connection: redis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 24 * 3600, count: 100 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  });
  return reviewTtlQueue;
}

export async function enqueueCoordinatorRun(
  data: CoordinatorJobData,
  opts?: JobsOptions,
) {
  return getCoordinatorQueue().add('run', data, opts);
}

/**
 * Idempotently installs the repeatable review-TTL sweep. BullMQ's `repeat.key`
 * deduplicates on the schedule identity so re-calling this on worker restart
 * does not create parallel repeatables — but we still clear any existing
 * repeatable with the same key first in case the cron expression changed.
 */
export async function ensureReviewTtlRepeatable(cron: string): Promise<void> {
  const q = getReviewTtlQueue();
  const existing = await q.getRepeatableJobs();
  for (const job of existing) {
    if (job.key?.includes(REVIEW_TTL_REPEAT_KEY) || job.name === REVIEW_TTL_JOB_NAME) {
      await q.removeRepeatableByKey(job.key);
    }
  }
  await q.add(
    REVIEW_TTL_JOB_NAME,
    {},
    {
      repeat: { pattern: cron, key: REVIEW_TTL_REPEAT_KEY },
      removeOnComplete: { age: 24 * 3600, count: 100 },
    },
  );
}

export function getRetentionQueue(): Queue<RetentionJobData> {
  if (retentionQueue) return retentionQueue;
  retentionQueue = new Queue<RetentionJobData>(RETENTION_QUEUE, {
    connection: redis(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { age: 7 * 24 * 3600, count: 50 },
      removeOnFail: { age: 30 * 24 * 3600 },
    },
  });
  return retentionQueue;
}

export async function ensureRetentionRepeatable(cron: string): Promise<void> {
  const q = getRetentionQueue();
  const existing = await q.getRepeatableJobs();
  for (const job of existing) {
    if (job.key?.includes(RETENTION_REPEAT_KEY) || job.name === RETENTION_JOB_NAME) {
      await q.removeRepeatableByKey(job.key);
    }
  }
  await q.add(
    RETENTION_JOB_NAME,
    {},
    {
      repeat: { pattern: cron, key: RETENTION_REPEAT_KEY },
      removeOnComplete: { age: 7 * 24 * 3600, count: 50 },
    },
  );
}
