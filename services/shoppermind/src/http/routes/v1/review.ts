import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAnyBearer } from '../../auth/bearer.js';
import {
  approveReview,
  listReview,
  rejectReview,
} from '../../../engine/review/review-service.js';

const ListQuery = z.object({
  marketId: z.string().min(1),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const ResolveBody = z.object({
  userId: z.string().min(1),
  note: z.string().optional(),
});

export const reviewRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/review', { preHandler: requireAnyBearer() }, async (req, reply) => {
    const parsed = ListQuery.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
      return;
    }
    return listReview(parsed.data);
  });

  app.post<{ Params: { id: string } }>(
    '/v1/review/:id/approve',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const parsed = ResolveBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }
      const result = await approveReview(req.params.id, parsed.data.userId, parsed.data.note);
      if (!result.ok) {
        reply.code(result.status).send({ error: result.error });
        return;
      }
      return result.value;
    },
  );

  app.post<{ Params: { id: string } }>(
    '/v1/review/:id/reject',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const parsed = ResolveBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }
      const result = await rejectReview(req.params.id, parsed.data.userId, parsed.data.note);
      if (!result.ok) {
        reply.code(result.status).send({ error: result.error });
        return;
      }
      return result.value;
    },
  );
};
