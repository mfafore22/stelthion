import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';
import { requireAnyBearer } from '../../auth/bearer.js';

const Query = z.object({
  marketId: z.string().min(1),
  date: z.string().optional(),
});

export const signalsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/signals-of-the-day', { preHandler: requireAnyBearer() }, async (req, reply) => {
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
      return;
    }
    const { marketId, date } = parsed.data;

    if (date) {
      const row = await prisma().signalOfTheDay.findUnique({
        where: { marketId_date: { marketId, date: new Date(date) } },
      });
      return { signalOfTheDay: row };
    }

    const latest = await prisma().signalOfTheDay.findFirst({
      where: { marketId },
      orderBy: { date: 'desc' },
    });
    return { signalOfTheDay: latest };
  });
};
