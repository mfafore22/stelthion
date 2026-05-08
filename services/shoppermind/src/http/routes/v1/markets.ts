import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma.js';
import {
  invalidateMarketCache,
  listMarkets,
  loadMarket,
} from '../../../engine/registry/market-registry.js';
import {
  MarketPolicySchema,
  MarketProfileSchema,
} from '../../../engine/registry/market-schema.js';
import { requireAnyBearer, requireBearer } from '../../auth/bearer.js';

const ConfigBody = z.object({
  country: z.string().length(2).optional(),
  region: z.string().nullable().optional(),
  displayName: z.string().optional(),
  industryFocus: z.string().optional(),
  geoAnchorLat: z.number().nullable().optional(),
  geoAnchorLon: z.number().nullable().optional(),
  footTrafficSubs: z.array(z.string()).optional(),
  culturalSubs: z.array(z.string()).optional(),
  footTrafficAxisWeight: z.number().min(0).max(1).optional(),
  culturalAxisWeight: z.number().min(0).max(1).optional(),
  profile: MarketProfileSchema.optional(),
  policy: MarketPolicySchema.optional(),
  active: z.boolean().optional(),
});

export const marketsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/markets', { preHandler: requireAnyBearer() }, async () => {
    const markets = await listMarkets();
    return {
      markets: markets.map((m) => ({
        id: m.id,
        country: m.country,
        region: m.region ?? null,
        displayName: m.displayName,
        industryFocus: m.industryFocus,
        active: m.active,
      })),
    };
  });

  app.get<{ Params: { marketId: string } }>(
    '/v1/markets/:marketId',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const market = await loadMarket(req.params.marketId);
      if (!market) {
        reply.code(404).send({ error: 'market_not_found' });
        return;
      }
      return {
        id: market.id,
        country: market.country,
        region: market.region ?? null,
        displayName: market.displayName,
        industryFocus: market.industryFocus,
        footTrafficSubs: market.footTrafficSubs,
        culturalSubs: market.culturalSubs,
        footTrafficAxisWeight: market.footTrafficAxisWeight,
        culturalAxisWeight: market.culturalAxisWeight,
        profile: market.profile,
        active: market.active,
      };
    },
  );

  // Admin: full config including policy internals. Gated to internal-token callers
  // because `policy` reveals the gate thresholds the mall app must never leak.
  app.get<{ Params: { marketId: string } }>(
    '/v1/markets/:marketId/config',
    { preHandler: requireBearer('internal') },
    async (req, reply) => {
      const market = await loadMarket(req.params.marketId);
      if (!market) {
        reply.code(404).send({ error: 'market_not_found' });
        return;
      }
      return market;
    },
  );

  app.put<{ Params: { marketId: string } }>(
    '/v1/markets/:marketId/config',
    { preHandler: requireBearer('internal') },
    async (req, reply) => {
      const parsed = ConfigBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }
      const body = parsed.data;
      const existing = await loadMarket(req.params.marketId);
      if (!existing) {
        reply.code(404).send({ error: 'market_not_found' });
        return;
      }

      await prisma().market.upsert({
        where: { id: req.params.marketId },
        create: {
          id: req.params.marketId,
          country: body.country ?? existing.country,
          region: body.region ?? existing.region ?? null,
          displayName: body.displayName ?? existing.displayName,
          industryFocus: body.industryFocus ?? existing.industryFocus,
          geoAnchorLat: body.geoAnchorLat ?? existing.geoAnchorLat ?? null,
          geoAnchorLon: body.geoAnchorLon ?? existing.geoAnchorLon ?? null,
          footTrafficSubs: body.footTrafficSubs ?? existing.footTrafficSubs,
          culturalSubs: body.culturalSubs ?? existing.culturalSubs,
          footTrafficAxisWeight: body.footTrafficAxisWeight ?? existing.footTrafficAxisWeight,
          culturalAxisWeight: body.culturalAxisWeight ?? existing.culturalAxisWeight,
          profile: body.profile ?? existing.profile,
          policy: body.policy ?? existing.policy,
          active: body.active ?? existing.active,
        },
        update: {
          ...(body.country !== undefined && { country: body.country }),
          ...(body.region !== undefined && { region: body.region }),
          ...(body.displayName !== undefined && { displayName: body.displayName }),
          ...(body.industryFocus !== undefined && { industryFocus: body.industryFocus }),
          ...(body.geoAnchorLat !== undefined && { geoAnchorLat: body.geoAnchorLat }),
          ...(body.geoAnchorLon !== undefined && { geoAnchorLon: body.geoAnchorLon }),
          ...(body.footTrafficSubs !== undefined && { footTrafficSubs: body.footTrafficSubs }),
          ...(body.culturalSubs !== undefined && { culturalSubs: body.culturalSubs }),
          ...(body.footTrafficAxisWeight !== undefined && {
            footTrafficAxisWeight: body.footTrafficAxisWeight,
          }),
          ...(body.culturalAxisWeight !== undefined && {
            culturalAxisWeight: body.culturalAxisWeight,
          }),
          ...(body.profile !== undefined && { profile: body.profile }),
          ...(body.policy !== undefined && { policy: body.policy }),
          ...(body.active !== undefined && { active: body.active }),
        },
      });

      invalidateMarketCache(req.params.marketId);
      const updated = await loadMarket(req.params.marketId);
      return updated;
    },
  );
};
