/**
 * GET /api/admin/floorplan/[mallId]/zones
 *
 * Phase E — floorplanRepo migration. Ownership + scoped list now live
 * in floorplanRepo.listZonesForMall; the route body shapes the
 * response.
 */

import { z } from 'zod';
import { defineHandler } from '@/server/api/define-handler';
import * as floorplanRepo from '@/server/repositories/floorplan';

const paramsSchema = z.object({ mallId: z.string() });

export const GET = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ req, params, auth: session }) => {
    const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';
    const zones = await floorplanRepo.listZonesForMall(session, params.mallId, floor);

    return zones.map((z) => ({
      id: z.id,
      zoneId: z.zoneId,
      name: z.name,
      nameFi: z.nameFi,
      category: z.category,
      subcategory: z.subcategory,
      drawShape: z.drawShape,
      svgPoints: z.svgPoints,
      labelX: z.labelX,
      labelY: z.labelY,
      capacity: z.capacity,
      areaSqm: z.areaSqm,
      baseVisitors: z.baseVisitors,
      publishedAt: z.publishedAt,
    }));
  },
);
