/**
 * GET /api/admin/floorplan/[mallId]/cameras
 *
 * Phase D — admin group migration. Pre-Phase-D this route was admin-gated
 * but did NOT validate that the calling admin's customer owned the mall —
 * a tenant admin could read another customer's camera placements (and
 * stream URLs) by mallId-guess. Now gated by requireMallOwnership.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';

const paramsSchema = z.object({ mallId: z.string() });

export const GET = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ req, params, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

    const cameras = await prisma.camera.findMany({
      where: { mallId: params.mallId, floor },
      orderBy: { label: 'asc' },
    });

    return cameras.map((c) => ({
      id: c.id,
      label: c.label,
      x: c.x,
      y: c.y,
      angleDeg: c.angleDeg,
      fovDeg: c.fovDeg,
      rangeM: c.rangeM,
      streamUrl: c.streamUrl,
      zoneDbId: c.zoneDbId,
      active: c.active,
    }));
  },
);
