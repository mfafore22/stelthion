/**
 * POST /api/admin/floorplan/[mallId]/publish
 *
 * Phase D — admin group migration. Pre-Phase-D this route was admin-gated
 * but did NOT validate that the calling admin's customer owned the mall.
 * A tenant admin could publish (mark as live) another customer's
 * floorplan zones by mallId+floor guess, which would surface unfinished
 * draft data to that customer's end users. Now gated by
 * requireMallOwnership.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';

const paramsSchema = z.object({ mallId: z.string() });
const bodySchema = z.object({ floor: z.string().min(1) });

export const POST = defineHandler(
  { auth: 'admin', paramsSchema, bodySchema },
  async ({ params, body, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const now = new Date();

    await prisma.floorplanZone.updateMany({
      where: { mallId: params.mallId, floor: body.floor },
      data: { publishedAt: now },
    });

    return { ok: true, publishedAt: now.toISOString() };
  },
);
