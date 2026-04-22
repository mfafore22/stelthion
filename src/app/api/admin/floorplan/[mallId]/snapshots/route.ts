/**
 * /api/admin/floorplan/[mallId]/snapshots
 *
 * GET: list snapshots for a mall+floor.
 * POST: restore a snapshot — destructive (deletes all current zones &
 *       cameras for the floor, replaces with snapshot contents).
 *
 * Phase D — admin group migration. Pre-Phase-D both verbs were
 * admin-gated but did NOT validate that the calling admin's customer
 * owned the mall. The leak shape:
 *   - GET: cross-tenant snapshot list — leaks the timestamps and
 *     reasons (e.g. "pre-restore") of another tenant's edits.
 *   - POST: cross-tenant destructive restore — wipes another tenant's
 *     current zones & cameras and overwrites them with stale snapshot
 *     data, breaking their floorplan.
 * Both verbs are now gated by requireMallOwnership. The POST verb
 * additionally re-validates that the snapshot's mallId matches the URL
 * mallId (which is now known to belong to the caller).
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

const paramsSchema = z.object({ mallId: z.string() });

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ req, params, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

    const snapshots = await prisma.floorplanSnapshot.findMany({
      where: { mallId: params.mallId, floor },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        reason: true,
        createdAt: true,
      },
    });

    return snapshots.map((s) => ({
      id: s.id,
      reason: s.reason,
      createdAt: s.createdAt,
    }));
  },
);

// ─── POST ───────────────────────────────────────────────────────────

interface LegacyStore {
  id: string; mallId: string; floor: string; name: string; slug: string;
  zoneDbId: string; x: number; y: number; w: number; h: number;
  publishedAt?: string | null;
}

function convertLegacyStores(stores: LegacyStore[]) {
  return stores.map((s) => ({
    id: s.id,
    mallId: s.mallId,
    floor: s.floor,
    zoneId: `store-${s.slug}`,
    name: s.name,
    nameFi: s.name,
    category: 'Store',
    subcategory: null,
    drawShape: 'rect',
    svgPoints: `${s.x},${s.y} ${s.x + s.w},${s.y} ${s.x + s.w},${s.y + s.h} ${s.x},${s.y + s.h}`,
    labelX: Math.round(s.x + s.w / 2),
    labelY: Math.round(s.y + s.h / 2),
    capacity: 0,
    areaSqm: 0,
    baseVisitors: 0,
    publishedAt: s.publishedAt ?? null,
  }));
}

const restoreBodySchema = z.object({
  snapshotId: z.string().min(1),
});

export const POST = defineHandler(
  { auth: 'admin', paramsSchema, bodySchema: restoreBodySchema },
  async ({ params, body, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const { mallId } = params;

    const snapshot = await prisma.floorplanSnapshot.findUnique({
      where: { id: body.snapshotId },
    });

    if (!snapshot || snapshot.mallId !== mallId) {
      throw new HttpError(404, 'Snapshot not found');
    }

    const parsed = JSON.parse(snapshot.data);
    let zones = parsed.zones ?? [];
    if (parsed.stores?.length) {
      zones = [...zones, ...convertLegacyStores(parsed.stores)];
    }
    const cameras = parsed.cameras ?? [];

    await createFloorplanSnapshot(prisma, mallId, snapshot.floor, 'pre-restore');

    await prisma.$transaction(async (tx) => {
      await tx.camera.deleteMany({ where: { mallId, floor: snapshot.floor } });
      await tx.floorplanZone.deleteMany({ where: { mallId, floor: snapshot.floor } });

      for (const z of zones) {
        await tx.floorplanZone.create({
          data: {
            mallId: z.mallId ?? mallId,
            floor: z.floor ?? snapshot.floor,
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
            publishedAt: z.publishedAt ? new Date(z.publishedAt) : null,
          },
        });
      }

      for (const c of cameras) {
        await tx.camera.create({
          data: {
            mallId: c.mallId ?? mallId,
            floor: c.floor ?? snapshot.floor,
            label: c.label,
            x: c.x,
            y: c.y,
            angleDeg: c.angleDeg ?? null,
            fovDeg: c.fovDeg ?? null,
            rangeM: c.rangeM ?? null,
            streamUrl: c.streamUrl ?? null,
            active: c.active ?? true,
          },
        });
      }
    });

    return {
      ok: true,
      restored: {
        zones: zones.length,
        cameras: cameras.length,
      },
    };
  },
);
