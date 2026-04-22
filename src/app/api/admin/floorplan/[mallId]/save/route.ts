/**
 * PUT /api/admin/floorplan/[mallId]/save
 *
 * Phase D — admin group migration. Pre-Phase-D this route was admin-gated
 * but did NOT validate that the calling admin's customer owned the mall.
 * A tenant admin could destructively overwrite another customer's
 * floorplan (zones + cameras) by mallId+floor guess. Now gated by
 * requireMallOwnership.
 *
 * The route's existing safety guards (refuse-when-empty, refuse-on-50%-loss,
 * pre-save snapshot, never-delete-zones-just-upsert) are preserved
 * bytewise — they protect against accidental destruction by an admin
 * who legitimately owns the mall.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

const paramsSchema = z.object({ mallId: z.string() });

export const PUT = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ req, params, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const { mallId } = params;
    const { floor, zones, cameras } = await req.json();

    const existingZoneCount = await prisma.floorplanZone.count({
      where: { mallId, floor },
    });
    const existingCameraCount = await prisma.camera.count({
      where: { mallId, floor },
    });

    if (existingZoneCount > 0 && (!Array.isArray(zones) || zones.length === 0)) {
      throw new HttpError(
        400,
        `Refused: save would delete all ${existingZoneCount} zones. Zones array is empty.`,
      );
    }

    if (!Array.isArray(zones) || !Array.isArray(cameras)) {
      throw new HttpError(400, 'Invalid payload: zones and cameras must be arrays.');
    }

    if (existingZoneCount > 4 && zones.length < existingZoneCount * 0.5) {
      throw new HttpError(
        400,
        `Refused: save would reduce zones from ${existingZoneCount} to ${zones.length} (>50% loss). Delete zones individually instead.`,
      );
    }

    if (existingCameraCount > 0 && cameras.length === 0) {
      throw new HttpError(
        400,
        `Refused: save would delete all ${existingCameraCount} cameras. Camera array is empty.`,
      );
    }

    await createFloorplanSnapshot(prisma, mallId, floor, 'pre-save');

    const existingZones = await prisma.floorplanZone.findMany({
      where: { mallId, floor },
      select: { zoneId: true, publishedAt: true },
    });
    const zonePublishedMap = new Map(
      existingZones.map((z) => [z.zoneId, z.publishedAt]),
    );
    const wasPublished = existingZones.some((z) => z.publishedAt !== null);
    const latestPublishedAt = wasPublished
      ? existingZones.reduce<Date | null>(
          (max, z) =>
            z.publishedAt && (!max || z.publishedAt > max) ? z.publishedAt : max,
          null,
        )
      : null;

    // ── Upsert zones (never delete) ──────────────────────────────────────────
    const BATCH_SIZE = 10;
    for (let i = 0; i < zones.length; i += BATCH_SIZE) {
      const batch = zones.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((z: any) =>
          prisma.floorplanZone.upsert({
            where: { mallId_floor_zoneId: { mallId, floor, zoneId: z.zoneId } },
            update: {
              name: z.name,
              nameFi: z.nameFi,
              category: z.category,
              subcategory: z.subcategory ?? null,
              drawShape: z.drawShape ?? 'polygon',
              svgPoints: z.svgPoints,
              labelX: z.labelX,
              labelY: z.labelY,
              capacity: z.capacity,
              areaSqm: z.areaSqm,
              baseVisitors: z.baseVisitors ?? 0,
              publishedAt: zonePublishedMap.get(z.zoneId) ?? latestPublishedAt,
            },
            create: {
              mallId,
              floor,
              zoneId: z.zoneId,
              name: z.name,
              nameFi: z.nameFi,
              category: z.category,
              subcategory: z.subcategory ?? null,
              drawShape: z.drawShape ?? 'polygon',
              svgPoints: z.svgPoints,
              labelX: z.labelX,
              labelY: z.labelY,
              capacity: z.capacity,
              areaSqm: z.areaSqm,
              baseVisitors: z.baseVisitors ?? 0,
              publishedAt: zonePublishedMap.get(z.zoneId) ?? latestPublishedAt,
            },
          }),
        ),
      );
    }

    // ── Cameras: only delete cameras not in current save, upsert the rest ───
    const incomingCameraLabels = cameras.map((c: any) => c.label);
    if (incomingCameraLabels.length > 0) {
      await prisma.camera.deleteMany({
        where: {
          mallId,
          floor,
          label: { notIn: incomingCameraLabels },
        },
      });
    }

    for (let i = 0; i < cameras.length; i += BATCH_SIZE) {
      const batch = cameras.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((c: any) =>
          prisma.camera.upsert({
            where: { id: c.id ?? '' },
            update: {
              label: c.label,
              x: c.x,
              y: c.y,
              deviceType: c.deviceType ?? 'camera',
              angleDeg: c.angleDeg ?? null,
              fovDeg: c.fovDeg ?? null,
              rangeM: c.rangeM ?? null,
              streamUrl: c.streamUrl ?? null,
              active: c.active ?? true,
            },
            create: {
              mallId,
              floor,
              label: c.label,
              x: c.x,
              y: c.y,
              deviceType: c.deviceType ?? 'camera',
              angleDeg: c.angleDeg ?? null,
              fovDeg: c.fovDeg ?? null,
              rangeM: c.rangeM ?? null,
              streamUrl: c.streamUrl ?? null,
              active: c.active ?? true,
            },
          }),
        ),
      );
    }

    const firstPublished = await prisma.floorplanZone.findFirst({
      where: { mallId, floor, publishedAt: { not: null } },
      select: { publishedAt: true },
    });

    return {
      ok: true,
      count: { zones: zones.length, cameras: cameras.length },
      publishedAt: firstPublished?.publishedAt?.toISOString() ?? null,
    };
  },
);
