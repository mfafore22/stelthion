import type { FastifyPluginAsync } from 'fastify';
import { runShopperMindAgentGovernance } from '../../../engine/agents/governance.js';
import { buildObservabilitySnapshot } from '../../../engine/observability/snapshot.js';
import { prisma } from '../../../db/prisma.js';
import { redis } from '../../../db/redis.js';
import { requireBearer } from '../../auth/bearer.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/internal/health', { preHandler: requireBearer('internal') }, async () => {
    const out: { status: string; postgres: string; redis: string } = {
      status: 'ok',
      postgres: 'unknown',
      redis: 'unknown',
    };
    try {
      await prisma().$queryRawUnsafe('SELECT 1');
      out.postgres = 'ok';
    } catch (err) {
      out.postgres = 'error';
      out.status = 'degraded';
      app.log.error({ err }, 'postgres healthcheck failed');
    }
    try {
      const pong = await redis().ping();
      out.redis = pong === 'PONG' ? 'ok' : 'error';
      if (out.redis !== 'ok') out.status = 'degraded';
    } catch (err) {
      out.redis = 'error';
      out.status = 'degraded';
      app.log.error({ err }, 'redis healthcheck failed');
    }
    return out;
  });

  app.get('/internal/governance', { preHandler: requireBearer('internal') }, async () => {
    const report = runShopperMindAgentGovernance();
    return { status: report.blockerCount === 0 ? 'ok' : 'blocked', ...report };
  });

  app.get('/internal/metrics', { preHandler: requireBearer('internal') }, async () =>
    buildObservabilitySnapshot());

  // Open, unauthenticated liveness probe - for container orchestrator health probes.
  app.get('/internal/live', async () => ({ status: 'ok' }));
};
