import type { FastifyPluginAsync } from 'fastify';
import { listMarkets, loadMarket } from '../../../engine/registry/market-registry.js';
import { requireAnyBearer } from '../../auth/bearer.js';

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
};
