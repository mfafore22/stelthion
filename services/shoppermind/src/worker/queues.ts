import { Queue, type JobsOptions } from 'bullmq';
import { redis } from '../db/redis.js';

export const COORDINATOR_QUEUE = 'shoppermind:coordinator';

export type CoordinatorJobData = {
  stages?: Array<'ingest' | 'cluster' | 'score' | 'publish'>;
  markets?: string[];
};

let coordinatorQueue: Queue<CoordinatorJobData> | null = null;

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

export async function enqueueCoordinatorRun(
  data: CoordinatorJobData,
  opts?: JobsOptions,
) {
  return getCoordinatorQueue().add('run', data, opts);
}
