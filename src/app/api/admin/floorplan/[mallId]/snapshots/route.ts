import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

/**
 * GET — list recent snapshots for a mall+floor
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

  const snapshots = await prisma.floorplanSnapshot.findMany({
    where: { mallId, floor },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      reason: true,
      createdAt: true,
    },
  });

  // Include counts from each snapshot's data for the list UI
  const list = snapshots.map((s) => {
    return {
      id: s.id,
      reason: s.reason,
      createdAt: s.createdAt,
    };
  });

  return NextResponse.json(list);
}

/**
 * POST — restore a snapshot by ID
 * Body: { snapshotId: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const { snapshotId } = await req.json();

  const snapshot = await prisma.floorplanSnapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot || snapshot.mallId !== mallId) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  const { zones, stores, cameras } = JSON.parse(snapshot.data);

  // Snapshot current state before restoring (so restore itself is reversible)
  await createFloorplanSnapshot(prisma, mallId, snapshot.floor, 'pre-restore');

  // Restore within a transaction
  await prisma.$transaction(async (tx) => {
    await tx.floorplanStore.deleteMany({ where: { mallId, floor: snapshot.floor } });
    await tx.camera.deleteMany({ where: { mallId, floor: snapshot.floor } });
    await tx.floorplanZone.deleteMany({ where: { mallId, floor: snapshot.floor } });

    // Recreate zones (with original IDs so store FK references work)
    for (const z of zones) {
      await tx.floorplanZone.create({
        data: {
          id: z.id,
          mallId: z.mallId,
          floor: z.floor,
          zoneId: z.zoneId,
          name: z.name,
          nameFi: z.nameFi,
          category: z.category,
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

    // Recreate stores
    for (const s of stores) {
      await tx.floorplanStore.create({
        data: {
          id: s.id,
          mallId: s.mallId,
          floor: s.floor,
          name: s.name,
          slug: s.slug,
          zoneDbId: s.zoneDbId,
          x: s.x,
          y: s.y,
          w: s.w,
          h: s.h,
          publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
        },
      });
    }

    // Recreate cameras
    for (const c of cameras) {
      await tx.camera.create({
        data: {
          id: c.id,
          mallId: c.mallId,
          floor: c.floor,
          label: c.label,
          x: c.x,
          y: c.y,
          angleDeg: c.angleDeg,
          fovDeg: c.fovDeg,
          rangeM: c.rangeM,
          streamUrl: c.streamUrl,
          zoneDbId: c.zoneDbId,
          active: c.active,
        },
      });
    }
  });

  return NextResponse.json({
    ok: true,
    restored: {
      zones: zones.length,
      stores: stores.length,
      cameras: cameras.length,
    },
  });
}
