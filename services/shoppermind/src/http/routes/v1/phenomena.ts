import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';
import { requireAnyBearer } from '../../auth/bearer.js';

const ListQuery = z.object({
  marketId: z.string().min(1),
  state: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const phenomenaRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/phenomena', { preHandler: requireAnyBearer() }, async (req, reply) => {
    const parsed = ListQuery.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
      return;
    }
    const { marketId, state, limit } = parsed.data;

    const scores = await prisma().phenomenonScore.findMany({
      where: { marketId },
      orderBy: [{ date: 'desc' }, { compositeScore: 'desc' }],
      take: limit * 3,
      include: { phenomenon: true },
    });

    const seen = new Set<string>();
    const out: Array<{
      id: string;
      label: string;
      description: string;
      state: string;
      phenomenonType: string | null;
      lifecycleState: string | null;
      culturalScope: string | null;
      culturalLocality: string | null;
      footTrafficScope: string | null;
      footTrafficLocality: string | null;
      compositeScore: number;
      footTrafficScore: number;
      culturalScore: number;
    }> = [];

    for (const s of scores) {
      if (seen.has(s.phenomenonId)) continue;
      if (state && s.phenomenon.state !== state) continue;
      seen.add(s.phenomenonId);
      out.push({
        id: s.phenomenon.id,
        label: s.phenomenon.label,
        description: s.phenomenon.description,
        state: s.phenomenon.state,
        phenomenonType: s.phenomenon.phenomenonType,
        lifecycleState: s.phenomenon.lifecycleState,
        culturalScope: s.phenomenon.culturalScope,
        culturalLocality: s.phenomenon.culturalLocality,
        footTrafficScope: s.phenomenon.footTrafficScope,
        footTrafficLocality: s.phenomenon.footTrafficLocality,
        compositeScore: s.compositeScore,
        footTrafficScore: s.footTrafficScore,
        culturalScore: s.culturalScore,
      });
      if (out.length >= limit) break;
    }

    return { phenomena: out };
  });

  app.get<{ Params: { id: string } }>(
    '/v1/phenomena/:id',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const phenomenon = await prisma().phenomenon.findUnique({
        where: { id: req.params.id },
        include: {
          scores: { orderBy: { date: 'desc' }, take: 30 },
          linksFrom: true,
          linksTo: true,
        },
      });
      if (!phenomenon) {
        reply.code(404).send({ error: 'phenomenon_not_found' });
        return;
      }
      return phenomenon;
    },
  );

  app.get<{ Params: { id: string } }>(
    '/v1/phenomena/:id/links',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const phenomenonId = req.params.id;
      const [from, to] = await Promise.all([
        prisma().phenomenonLink.findMany({
          where: { fromPhenomenonId: phenomenonId, supersededAt: null },
        }),
        prisma().phenomenonLink.findMany({
          where: { toPhenomenonId: phenomenonId, supersededAt: null },
        }),
      ]);
      if (!from.length && !to.length) {
        const exists = await prisma().phenomenon.findUnique({ where: { id: phenomenonId } });
        if (!exists) {
          reply.code(404).send({ error: 'phenomenon_not_found' });
          return;
        }
      }
      return { linksFrom: from, linksTo: to };
    },
  );
};
