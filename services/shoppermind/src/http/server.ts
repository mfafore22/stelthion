import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { env } from '../config/env.js';
import { disconnectPrisma } from '../db/prisma.js';
import { disconnectRedis } from '../db/redis.js';
import { bullBoardRoutes } from './routes/internal/bull-board.js';
import { healthRoutes } from './routes/internal/health.js';
import { cronRoutes } from './routes/internal/cron.js';
import { marketsRoutes } from './routes/v1/markets.js';
import { phenomenaRoutes } from './routes/v1/phenomena.js';
import { signalsRoutes } from './routes/v1/signals.js';
import { reviewRoutes } from './routes/v1/review.js';
import { resonanceRoutes } from './routes/v1/resonance.js';
import { insightsRoutes } from './routes/v1/insights.js';
import { propertiesRoutes } from './routes/v1/properties.js';
import { recordApiRequest } from '../engine/observability/api-metrics.js';
import { classifyRoute, rateLimitByRequest } from './security/rate-limit.js';

type TimedRequest = { startTime?: number };

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env().LOG_LEVEL,
      transport:
        env().NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    },
    disableRequestLogging: env().NODE_ENV === 'test',
  });

  await app.register(sensible);
  app.addHook('onRequest', rateLimitByRequest);
  app.addHook('onRequest', async (req) => {
    (req as TimedRequest).startTime = Date.now();
  });
  app.addHook('onResponse', async (req, reply) => {
    const startTime = (req as TimedRequest).startTime ?? Date.now();
    recordApiRequest({
      routeClass: classifyRoute(req.url),
      statusCode: reply.statusCode,
      durationMs: Date.now() - startTime,
    });
  });

  await app.register(healthRoutes);
  await app.register(cronRoutes);
  if (env().BULL_BOARD_ENABLED && env().NODE_ENV !== 'test') {
    await app.register(bullBoardRoutes);
  }
  await app.register(marketsRoutes);
  await app.register(phenomenaRoutes);
  await app.register(signalsRoutes);
  await app.register(reviewRoutes);
  await app.register(resonanceRoutes);
  await app.register(insightsRoutes);
  await app.register(propertiesRoutes);

  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    req.log.error({ err }, 'unhandled request error');
    if (reply.sent) return;
    reply.code(err.statusCode ?? 500).send({ error: err.name || 'internal_error' });
  });

  return app;
}

async function main(): Promise<void> {
  const app = await buildServer();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      await disconnectPrisma();
      await disconnectRedis();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ port: env().PORT, host: '0.0.0.0' });
}

// Run only when invoked directly.

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

