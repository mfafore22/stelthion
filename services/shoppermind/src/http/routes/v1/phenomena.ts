import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';
import {
  INTERACTION_KINDS,
  recordInteraction,
  summariseInteractions,
} from '../../../engine/insights/feedback-collector.js';
import { predictForTrend } from '../../../engine/predictive/event-predictor.js';
import { requireAnyBearer, requireBearer } from '../../auth/bearer.js';

const ListQuery = z.object({
  marketId: z.string().min(1),
  state: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const LINK_TYPES = [
  'CONTRIBUTES_TO',
  'MANIFESTATION_OF',
  'ACCELERATES',
  'PRECEDES',
  'CONTRADICTS',
] as const;

const LinkBody = z.object({
  toPhenomenonId: z.string().min(1),
  linkType: z.enum(LINK_TYPES),
  weight: z.number().min(0).max(1).default(1),
  rationale: z.string().optional(),
  inferredBy: z.string().min(1).default('human'),
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

  // Admin: author a human link between two phenomena. Upserts on the unique
  // (from, to, type) tuple so a human override cleanly replaces any prior
  // auto-inferred link without colliding with the unique index.
  app.post<{ Params: { id: string } }>(
    '/v1/phenomena/:id/links',
    { preHandler: requireBearer('internal') },
    async (req, reply) => {
      const parsed = LinkBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }
      const { toPhenomenonId, linkType, weight, rationale, inferredBy } = parsed.data;
      const fromId = req.params.id;

      if (fromId === toPhenomenonId) {
        reply.code(400).send({ error: 'self_link' });
        return;
      }

      const [from, to] = await Promise.all([
        prisma().phenomenon.findUnique({ where: { id: fromId } }),
        prisma().phenomenon.findUnique({ where: { id: toPhenomenonId } }),
      ]);
      if (!from || !to) {
        reply.code(404).send({ error: 'phenomenon_not_found' });
        return;
      }

      const saved = await prisma().phenomenonLink.upsert({
        where: {
          fromPhenomenonId_toPhenomenonId_linkType: {
            fromPhenomenonId: fromId,
            toPhenomenonId,
            linkType,
          },
        },
        create: {
          fromPhenomenonId: fromId,
          toPhenomenonId,
          linkType,
          weight,
          inferredBy,
          rationale: rationale ?? null,
        },
        update: {
          weight,
          inferredBy,
          rationale: rationale ?? null,
          supersededAt: null,
        },
      });

      reply.code(201);
      return saved;
    },
  );

  const FeedbackBody = z.object({
    userId: z.string().min(1),
    marketId: z.string().min(1).optional(),
    interactionKind: z.enum(INTERACTION_KINDS).default('thumbs'),
    verdict: z.string().min(1),
    note: z.string().optional(),
  });

  app.post(
    '/v1/phenomena/:id/feedback',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = FeedbackBody.safeParse(req.body);
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }

      const phenomenon = await prisma().phenomenon.findUnique({ where: { id } });
      if (!phenomenon) {
        reply.code(404).send({ error: 'phenomenon_not_found' });
        return;
      }

      const saved = await recordInteraction({
        phenomenonId: id,
        userId: parsed.data.userId,
        marketId: parsed.data.marketId,
        interactionKind: parsed.data.interactionKind,
        verdict: parsed.data.verdict,
        note: parsed.data.note,
      });
      reply.code(201);
      return saved;
    },
  );

  const InteractionQuery = z.object({
    marketId: z.string().min(1).optional(),
    windowDays: z.coerce.number().int().min(1).max(365).default(30),
  });

  app.get(
    '/v1/phenomena/:id/interactions',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = InteractionQuery.safeParse(req.query);
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
        return;
      }
      return summariseInteractions(id, parsed.data.marketId, parsed.data.windowDays);
    },
  );

  app.get(
    '/v1/phenomena/:id/predicted-events',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const phenomenon = await prisma().phenomenon.findUnique({
        where: { id },
        select: { id: true, phenomenonType: true },
      });
      if (!phenomenon) {
        reply.code(404).send({ error: 'phenomenon_not_found' });
        return;
      }
      if (phenomenon.phenomenonType !== 'TREND') {
        return { prediction: null, reason: 'not_a_trend' };
      }
      const prediction = await predictForTrend(id);
      return { prediction, reason: prediction ? null : 'insufficient_basis' };
    },
  );
};
