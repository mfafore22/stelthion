import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Readable } from 'node:stream';
import { streamTrainingRecords } from '../../../engine/insights/training-export.js';
import { getLearningPort } from '../../../engine/learning/learning-port.js';
import { answerInsightsQuestion } from '../../../engine/insights/chat-service.js';
import { requireAnyBearer, requireBearer } from '../../auth/bearer.js';

const STATUSES = ['APPROVED', 'REJECTED', 'EXPIRED', 'PENDING'] as const;

const ExportQuery = z.object({
  marketId: z.string().min(1).optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100000).optional(),
  status: z
    .union([z.enum(STATUSES), z.array(z.enum(STATUSES))])
    .optional()
    .transform((v) => (v == null ? undefined : Array.isArray(v) ? v : [v])),
});

export const insightsRoutes: FastifyPluginAsync = async (app) => {
  // Admin-only NDJSON export of reviewer-resolved training records.
  app.get('/v1/insights/export', { preHandler: requireBearer('internal') }, async (req, reply) => {
    const parsed = ExportQuery.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
      return;
    }
    const { marketId, since, until, limit, status } = parsed.data;

    reply.header('Content-Type', 'application/x-ndjson; charset=utf-8');
    reply.header(
      'Content-Disposition',
      `attachment; filename="shoppermind-training-${new Date().toISOString().slice(0, 10)}.jsonl"`,
    );

    const iterator = streamTrainingRecords({
      marketId,
      since: since ? new Date(since) : undefined,
      until: until ? new Date(until) : undefined,
      limit,
      status,
    });

    return reply.send(Readable.from(ndjson(iterator)));
  });

  app.get(
    '/v1/insights/policy-events/export',
    { preHandler: requireBearer('internal') },
    async (req, reply) => {
      const parsed = ExportQuery.safeParse(req.query);
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
        return;
      }
      const { marketId, since, until, limit } = parsed.data;
      reply.header('Content-Type', 'application/x-ndjson; charset=utf-8');
      const events = await getLearningPort().listTrainingEvents({
        domain: 'shoppermind',
        marketId,
        since,
        until,
        limit,
        source: 'review_outcome',
      });
      return reply.send(Readable.from(ndjson(events)));
    },
  );

  app.get(
    '/v1/feedback/policy-events/export',
    { preHandler: requireBearer('internal') },
    async (req, reply) => {
      const parsed = ExportQuery.omit({ status: true }).safeParse(req.query);
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
        return;
      }
      const events = await getLearningPort().listTrainingEvents({
        domain: 'shoppermind',
        marketId: parsed.data.marketId,
        since: parsed.data.since,
        until: parsed.data.until,
        limit: parsed.data.limit,
        source: 'user_feedback',
      });
      reply.header('Content-Type', 'application/x-ndjson; charset=utf-8');
      return reply.send(Readable.from(ndjson(events)));
    },
  );

  const ChatBody = z.object({
    marketId: z.string().min(1),
    question: z.string().min(1).max(2000),
    topK: z.number().int().min(1).max(10).optional(),
    windowDays: z.number().int().min(1).max(365).optional(),
  });

  app.post('/v1/insights/chat', { preHandler: requireAnyBearer() }, async (req, reply) => {
    const parsed = ChatBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
      return;
    }
    const response = await answerInsightsQuestion(parsed.data);
    return response;
  });
};

async function* ndjson<T>(iterator: AsyncIterable<T> | Iterable<T>) {
  for await (const record of iterator) {
    yield JSON.stringify(record) + '\n';
  }
}
