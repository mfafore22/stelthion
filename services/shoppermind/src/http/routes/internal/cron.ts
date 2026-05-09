import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getPrismaLearningPort } from '../../../engine/learning/learning-port.js';
import { materializeSignalOfTheDay } from '../../../engine/signals/signal-of-the-day-materializer.js';
import { enqueueCoordinatorRun } from '../../../worker/queues.js';
import { requireBearer } from '../../auth/bearer.js';

const CronBody = z.object({
  stages: z.array(z.enum(['ingest', 'cluster', 'score', 'publish'])).optional(),
  markets: z.array(z.string()).optional(),
});

const SignalOfTheDayBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  markets: z.array(z.string()).optional(),
  refreshCaches: z.boolean().optional(),
});

export const cronRoutes: FastifyPluginAsync = async (app) => {
  app.post('/internal/cron/run', { preHandler: requireBearer('internal') }, async (req, reply) => {
    const parsed = CronBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
      return;
    }
    const job = await enqueueCoordinatorRun(parsed.data);
    return { enqueued: true, jobId: job.id };
  });

  app.post(
    '/internal/cron/learning-retention',
    { preHandler: requireBearer('internal') },
    async () => getPrismaLearningPort().pruneExpiredTrainingEvents(),
  );

  app.post(
    '/internal/cron/signal-of-the-day',
    { preHandler: requireBearer('internal') },
    async (req, reply) => {
      const parsed = SignalOfTheDayBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }
      return materializeSignalOfTheDay({
        date: parsed.data.date,
        marketIds: parsed.data.markets,
        refreshCaches: parsed.data.refreshCaches,
      });
    },
  );
};
