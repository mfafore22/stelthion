import { Worker, type Job } from 'bullmq';
import pino from 'pino';
import { env } from '../config/env.js';
import { disconnectPrisma } from '../db/prisma.js';
import { disconnectRedis, redis } from '../db/redis.js';
import { runPipeline } from '../engine/coordinator/coordinator.js';
import { COORDINATOR_QUEUE, type CoordinatorJobData } from './queues.js';

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

async function main(): Promise<void> {
  const worker = new Worker<CoordinatorJobData>(COORDINATOR_QUEUE, processCoordinatorJob, {
    connection: redis(),
    concurrency: 1,
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'coordinator job failed');
  });
  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'coordinator job completed');
  });

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'worker shutting down');
    try {
      await worker.close();
      await disconnectPrisma();
      await disconnectRedis();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  log.info({ queue: COORDINATOR_QUEUE }, 'worker online');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    log.error({ err }, 'worker bootstrap failed');
    process.exit(1);
  });
}
