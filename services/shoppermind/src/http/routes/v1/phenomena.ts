import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';
import {
  generateCampaignIdea,
  type CampaignIdeaInput,
} from '../../../engine/campaign-ideas.js';
import {
  INTERACTION_KINDS,
  listFeedback,
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
    const latestByPhenomenon = new Map<string, (typeof scores)[number]>();
    for (const s of scores) {
      if (!latestByPhenomenon.has(s.phenomenonId)) {
        latestByPhenomenon.set(s.phenomenonId, s);
      }
    }

    const selectedIds: string[] = [];
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
      categories: string[];
      keywords: string[];
      latestVelocity: number;
      i18n: unknown;
      recentScores?: Array<{
        id: string;
        phenomenonId: string;
        marketId: string;
        country: string;
        date: string;
        volume: number;
        velocity: number;
        acceleration: number;
        noiseAdjusted: number;
        sourceDiversity: number;
        compositeScore: number;
        footTrafficScore: number;
        culturalScore: number;
        footTrafficProximity: number;
        culturalProximity: number;
        linkBoost: number;
      }>;
    }> = [];

    for (const s of scores) {
      if (seen.has(s.phenomenonId)) continue;
      if (state && s.phenomenon.state !== state) continue;
      seen.add(s.phenomenonId);
      selectedIds.push(s.phenomenonId);
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
        categories: s.phenomenon.categories ?? [],
        keywords: s.phenomenon.keywords ?? [],
        latestVelocity: s.velocity,
        i18n: s.phenomenon.i18n ?? null,
      });
      if (out.length >= limit) break;
    }

    // Attach 14d recent score history per selected phenomenon for sparklines.
    if (selectedIds.length > 0) {
      const history = await prisma().phenomenonScore.findMany({
        where: { marketId, phenomenonId: { in: selectedIds } },
        orderBy: [{ date: 'desc' }],
        take: selectedIds.length * 14,
      });
      const byPhenomenon = new Map<string, typeof history>();
      for (const row of history) {
        const bucket = byPhenomenon.get(row.phenomenonId) ?? [];
        if (bucket.length < 14) {
          bucket.push(row);
          byPhenomenon.set(row.phenomenonId, bucket);
        }
      }
      for (const row of out) {
        const rows = byPhenomenon.get(row.id);
        if (rows && rows.length > 0) {
          row.recentScores = rows.map((r) => ({
            id: r.id,
            phenomenonId: r.phenomenonId,
            marketId: r.marketId,
            country: r.country,
            date: r.date.toISOString(),
            volume: r.volume,
            velocity: r.velocity,
            acceleration: r.acceleration,
            noiseAdjusted: r.noiseAdjusted,
            sourceDiversity: r.sourceDiversity,
            compositeScore: r.compositeScore,
            footTrafficScore: r.footTrafficScore,
            culturalScore: r.culturalScore,
            footTrafficProximity: r.footTrafficProximity,
            culturalProximity: r.culturalProximity,
            linkBoost: r.linkBoost,
          }));
        }
      }
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

  const FeedbackListQuery = z.object({
    phenomenonId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    verdict: z.string().min(1).optional(),
    marketId: z.string().min(1).optional(),
    since: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  });

  app.get('/v1/feedback', { preHandler: requireAnyBearer() }, async (req, reply) => {
    const parsed = FeedbackListQuery.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
      return;
    }
    const since = parsed.data.since ? new Date(parsed.data.since) : undefined;
    return listFeedback({
      phenomenonId: parsed.data.phenomenonId,
      userId: parsed.data.userId,
      verdict: parsed.data.verdict,
      marketId: parsed.data.marketId,
      since,
      limit: parsed.data.limit,
    });
  });

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

  const CampaignIdeaBody = z.object({
    marketId: z.string().min(1),
    language: z.enum(['fi', 'en', 'sv']).default('en'),
    angle: z.string().min(1).max(280).optional(),
    audience: z.string().min(1).max(280).optional(),
    budget: z.enum(['light', 'standard', 'premium']).default('standard'),
    durationDays: z.coerce.number().int().min(3).max(60).optional(),
  });

  app.post<{ Params: { id: string } }>(
    '/v1/phenomena/:id/campaign-idea',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const parsed = CampaignIdeaBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }
      const { id } = req.params;
      const { marketId, language, angle, audience, budget, durationDays } = parsed.data;

      const [phenomenon, market, latestScore] = await Promise.all([
        prisma().phenomenon.findUnique({ where: { id } }),
        prisma().market.findUnique({ where: { id: marketId } }),
        prisma().phenomenonScore.findFirst({
          where: { phenomenonId: id, marketId },
          orderBy: [{ date: 'desc' }],
        }),
      ]);
      if (!phenomenon) {
        reply.code(404).send({ error: 'phenomenon_not_found' });
        return;
      }
      if (!market) {
        reply.code(404).send({ error: 'market_not_found' });
        return;
      }

      const localized = pickLocalized(phenomenon.i18n, language);
      const label = localized?.label?.trim() || phenomenon.label;
      const summary =
        localized?.summary?.trim() ||
        pickLocalized(phenomenon.i18n, 'en')?.summary?.trim() ||
        phenomenon.description;
      const retailerImpact =
        localized?.retailerImpact?.trim() ||
        pickLocalized(phenomenon.i18n, 'en')?.retailerImpact?.trim() ||
        null;
      const opportunity =
        localized?.opportunity?.trim() ||
        pickLocalized(phenomenon.i18n, 'en')?.opportunity?.trim() ||
        null;

      const input: CampaignIdeaInput = {
        phenomenonId: phenomenon.id,
        label,
        state: phenomenon.state,
        phenomenonType: phenomenon.phenomenonType,
        primaryCountry: phenomenon.primaryCountry,
        culturalScope: phenomenon.culturalScope,
        culturalLocality: phenomenon.culturalLocality,
        footTrafficScope: phenomenon.footTrafficScope,
        footTrafficLocality: phenomenon.footTrafficLocality,
        categories: phenomenon.categories ?? [],
        keywords: phenomenon.keywords ?? [],
        compositeScore: latestScore?.compositeScore ?? 0,
        velocity: latestScore?.velocity ?? 0,
        summary,
        retailerImpact,
        opportunity,
        marketDisplay: market.displayName,
        industryFocus: market.industryFocus,
      };

      const idea = await generateCampaignIdea(input, {
        language,
        angle,
        audience,
        budget,
        durationDays,
      });
      return { idea };
    },
  );
};

interface LocalizedBlock {
  label?: string;
  summary?: string;
  stateCommentary?: string;
  retailerImpact?: string;
  opportunity?: string;
  description?: string;
}

function pickLocalized(i18n: unknown, lang: string): LocalizedBlock | null {
  if (!i18n || typeof i18n !== 'object') return null;
  const map = i18n as Record<string, unknown>;
  const head = (lang.split('-')[0] ?? 'en').toLowerCase();
  const direct = map[head];
  if (direct && typeof direct === 'object') return direct as LocalizedBlock;
  return null;
}
