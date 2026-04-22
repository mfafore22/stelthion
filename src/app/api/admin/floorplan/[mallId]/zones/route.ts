/**
 * GET /api/admin/floorplan/[mallId]/zones
 *
 * Phase D — admin group migration. Pre-Phase-D this route was admin-gated
 * but did NOT validate that the calling admin's customer owned the mall —
 * a tenant admin could read another customer's zone definitions
 * (geometry, capacity, baseVisitors) by mallId+floor guess. Now gated by
 * requireMallOwnership.
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

    const zones = await prisma.floorplanZone.findMany({
      where: { mallId: params.mallId, floor },
      orderBy: { zoneId: 'asc' },
    });

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
