import type { FastifyPluginAsync } from 'fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import {
  getCoordinatorQueue,
  getRetentionQueue,
  getReviewTtlQueue,
} from '../../../worker/queues.js';
import { requireBearer } from '../../auth/bearer.js';

const BASE_PATH = '/internal/bull-board';

export const bullBoardRoutes: FastifyPluginAsync = async (app) => {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath(BASE_PATH);

  createBullBoard({
    queues: [
      new BullMQAdapter(getCoordinatorQueue()),
      new BullMQAdapter(getReviewTtlQueue()),
      new BullMQAdapter(getRetentionQueue()),
    ],
    serverAdapter,
  });

  await app.register(async (scoped) => {
    scoped.addHook('preHandler', requireBearer('internal'));
    await scoped.register(serverAdapter.registerPlugin(), { prefix: BASE_PATH });
  });
};
