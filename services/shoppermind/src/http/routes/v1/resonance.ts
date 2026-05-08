import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { detectResonance } from '../../../engine/resonance/resonance-service.js';
import { requireAnyBearer } from '../../auth/bearer.js';

const Query = z.object({
  date: z.string().optional(),
  marketId: z.string().min(1).optional(),
  minMarkets: z.coerce.number().int().min(2).max(20).default(2),
  minCompositeScore: z.coerce.number().min(0).max(1).default(0.3),
});

function startOfUtcDay(input: Date): Date {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const resonanceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/resonance', { preHandler: requireAnyBearer() }, async (req, reply) => {
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
      return;
    }
    const { date, marketId, minMarkets, minCompositeScore } = parsed.data;
    const day = startOfUtcDay(date ? new Date(date) : new Date());
    const resonances = await detectResonance({
      date: day,
      marketId,
      minMarkets,
      minCompositeScore,
    });
    return { date: day.toISOString(), count: resonances.length, resonances };
  });
};
