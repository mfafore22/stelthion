import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { env } from '../config/env.js';
import { disconnectPrisma } from '../db/prisma.js';
import { disconnectRedis, redis } from '../db/redis.js';
import { runPipeline } from '../engine/coordinator/coordinator.js';
import { expireReviewItems } from '../engine/review/review-service.js';
import {
  COORDINATOR_QUEUE,
  REVIEW_TTL_QUEUE,
  ensureReviewTtlRepeatable,
  type CoordinatorJobData,
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

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'worker shutting down');
    try {
      await Promise.all([coordinatorWorker.close(), reviewTtlWorker.close()]);
      await disconnectPrisma();
      await disconnectRedis();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  log.info({ queues: [COORDINATOR_QUEUE, REVIEW_TTL_QUEUE] }, 'worker online');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    log.error({ err }, 'worker bootstrap failed');
    process.exit(1);
  });
}
