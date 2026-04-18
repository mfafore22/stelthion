import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { env } from '../config/env.js';
import { disconnectPrisma } from '../db/prisma.js';
import { disconnectRedis, redis } from '../db/redis.js';
import { runPipeline } from '../engine/coordinator/coordinator.js';
import { runRetention } from '../engine/retention/retention-service.js';
import { expireReviewItems } from '../engine/review/review-service.js';
import {
  COORDINATOR_QUEUE,
  RETENTION_QUEUE,
  REVIEW_TTL_QUEUE,
  ensureRetentionRepeatable,
  ensureReviewTtlRepeatable,
  type CoordinatorJobData,
  type RetentionJobData,
  type ReviewTtlJobData,
} from './queues.js';

const log = pino({
  level: env().LOG_LEVEL,
  transport:
    env().NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});

async function processCoordinatorJob(job: Job<CoordinatorJobData>) {
  log.info({ jobId: job.id, data: job.data }, 'coordinator job start');
  const summary = await runPipeline({
    marketIds: job.data.markets,
    stages: job.data.stages,
  });
  log.info({ jobId: job.id, summary }, 'coordinator job done');
  return summary;
}

async function processReviewTtlJob(job: Job<ReviewTtlJobData>) {
  const summary = await expireReviewItems();
  if (summary.expired > 0) {
    log.info({ jobId: job.id, ...summary }, 'review-ttl sweep expired items');
  } else {
    log.debug({ jobId: job.id, ...summary }, 'review-ttl sweep — nothing to expire');
  }
  return summary;
}

async function processRetentionJob(job: Job<RetentionJobData>) {
  const summary = await runRetention({
    scoreRetentionDays: env().RETENTION_SCORE_DAYS,
    reviewRetentionDays: env().RETENTION_REVIEW_DAYS,
  });
  if (summary.scoresDeleted > 0 || summary.reviewsDeleted > 0) {
    log.info({ jobId: job.id, ...summary }, 'retention sweep pruned rows');
  } else {
    log.debug({ jobId: job.id, ...summary }, 'retention sweep — nothing to prune');
  }
  return summary;
}

async function main(): Promise<void> {
  const coordinatorWorker = new Worker<CoordinatorJobData>(
    COORDINATOR_QUEUE,
    processCoordinatorJob,
    { connection: redis(), concurrency: 1 },
  );
  coordinatorWorker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'coordinator job failed');
  });
  coordinatorWorker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'coordinator job completed');
  });

  const reviewTtlWorker = new Worker<ReviewTtlJobData>(
    REVIEW_TTL_QUEUE,
    processReviewTtlJob,
    { connection: redis(), concurrency: 1 },
  );
  reviewTtlWorker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'review-ttl job failed');
  });

  const retentionWorker = new Worker<RetentionJobData>(
    RETENTION_QUEUE,
    processRetentionJob,
    { connection: redis(), concurrency: 1 },
  );
  retentionWorker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'retention job failed');
  });

  if (env().REVIEW_TTL_ENABLED) {
    try {
      await ensureReviewTtlRepeatable(env().REVIEW_TTL_CRON);
      log.info({ cron: env().REVIEW_TTL_CRON }, 'review-ttl repeatable installed');
    } catch (err) {
      log.error({ err }, 'failed to install review-ttl repeatable');
    }
  } else {
    log.info('review-ttl sweep disabled via env');
  }

  if (env().RETENTION_ENABLED) {
    try {
      await ensureRetentionRepeatable(env().RETENTION_CRON);
      log.info(
        {
          cron: env().RETENTION_CRON,
          scoreDays: env().RETENTION_SCORE_DAYS,
          reviewDays: env().RETENTION_REVIEW_DAYS,
        },
        'retention repeatable installed',
      );
    } catch (err) {
      log.error({ err }, 'failed to install retention repeatable');
    }
  } else {
    log.info('retention sweep disabled via env');
  }

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'worker shutting down');
    try {
      await Promise.all([
        coordinatorWorker.close(),
        reviewTtlWorker.close(),
        retentionWorker.close(),
      ]);
      await disconnectPrisma();
      await disconnectRedis();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  log.info(
    { queues: [COORDINATOR_QUEUE, REVIEW_TTL_QUEUE, RETENTION_QUEUE] },
    'worker online',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    log.error({ err }, 'worker bootstrap failed');
    process.exit(1);
  });
}
