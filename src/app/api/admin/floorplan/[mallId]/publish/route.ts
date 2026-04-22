/**
 * POST /api/admin/floorplan/[mallId]/publish
 *
 * Phase E — floorplanRepo migration. Ownership + updateMany now live in
 * floorplanRepo.publishZonesForMall.
 */

import { z } from 'zod';
import { defineHandler } from '@/server/api/define-handler';
import * as floorplanRepo from '@/server/repositories/floorplan';

const paramsSchema = z.object({ mallId: z.string() });
const bodySchema = z.object({ floor: z.string().min(1) });

export const POST = defineHandler(
  { auth: 'admin', paramsSchema, bodySchema },
  async ({ params, body, auth: session }) => {
    const { publishedAt } = await floorplanRepo.publishZonesForMall(
      session,
      params.mallId,
      body.floor,
    );
    return { ok: true, publishedAt: publishedAt.toISOString() };
  },
);
