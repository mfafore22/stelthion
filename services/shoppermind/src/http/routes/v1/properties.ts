import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getPropertyActions } from '../../../engine/actions/property-actions.js';
import { requireAnyBearer } from '../../auth/bearer.js';

const Query = z.object({
  marketId: z.string().min(1).optional(),
});

export const propertiesRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { propertyId: string } }>(
    '/v1/properties/:propertyId/actions',
    { preHandler: requireAnyBearer() },
    async (req, reply) => {
      const parsed = Query.safeParse(req.query);
      if (!parsed.success) {
        reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
        return;
      }

      const result = getPropertyActions(req.params.propertyId, parsed.data.marketId);
      if (!result) {
        reply.code(404).send({ error: 'property_actions_not_found' });
        return;
      }

      return result;
    },
  );
};
