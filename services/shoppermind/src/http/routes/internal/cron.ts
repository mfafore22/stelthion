import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { enqueueCoordinatorRun } from '../../../worker/queues.js';
import { requireBearer } from '../../auth/bearer.js';

const CronBody = z.object({
  stages: z.array(z.enum(['ingest', 'cluster', 'score', 'publish'])).optional(),
  markets: z.array(z.string()).optional(),
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
};
