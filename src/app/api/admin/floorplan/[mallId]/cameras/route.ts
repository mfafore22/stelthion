/**
 * GET /api/admin/floorplan/[mallId]/cameras
 *
 * Phase E — floorplanRepo migration. Ownership + scoped list now live
 * in floorplanRepo.listCamerasForMall.
 */

import { z } from 'zod';
import { defineHandler } from '@/server/api/define-handler';
import * as floorplanRepo from '@/server/repositories/floorplan';

const paramsSchema = z.object({ mallId: z.string() });

export const GET = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ req, params, auth: session }) => {
    const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';
    const cameras = await floorplanRepo.listCamerasForMall(session, params.mallId, floor);

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
