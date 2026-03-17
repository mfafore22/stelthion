import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

/**
 * Combined atomic save — zones, stores, cameras in one transaction.
 * Prevents cascading data loss from separate sequential requests.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const { floor, zones, stores, cameras } = await req.json();

  // Snapshot current state before destructive save
  await createFloorplanSnapshot(prisma, mallId, floor, 'pre-save');

  await prisma.$transaction(async (tx) => {
    // 0. Capture current publishedAt so we can preserve live status through saves
    const existingZones = await tx.floorplanZone.findMany({
      where: { mallId, floor },
      select: { zoneId: true, publishedAt: true },
    });
    const zonePublishedMap = new Map(
      existingZones.map((z) => [z.zoneId, z.publishedAt]),
    );

    const existingStores = await tx.floorplanStore.findMany({
      where: { mallId, floor },
      select: { slug: true, publishedAt: true },
    });
    const storePublishedMap = new Map(
      existingStores.map((s) => [s.slug, s.publishedAt]),
    );

    // 1. Delete in FK-safe order: stores → cameras → zones
    await tx.floorplanStore.deleteMany({ where: { mallId, floor } });
    await tx.camera.deleteMany({ where: { mallId, floor } });
    await tx.floorplanZone.deleteMany({ where: { mallId, floor } });

    // 2. Recreate zones — preserve publishedAt from previous version
    const zoneIdMap = new Map<string, string>();
    for (const z of zones) {
      const created = await tx.floorplanZone.create({
        data: {
          mallId,
          floor,
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
          publishedAt: zonePublishedMap.get(z.zoneId) ?? null,
        },
      });
      zoneIdMap.set(z.zoneId, created.id);
    }

    // 3. Recreate stores — preserve publishedAt from previous version
    for (const s of stores) {
      const zoneDbId = zoneIdMap.get(s.zoneId);
      if (!zoneDbId) continue;
      await tx.floorplanStore.create({
        data: {
          mallId,
          floor,
          name: s.name,
          slug: s.slug,
          zoneDbId,
          x: s.x,
          y: s.y,
          w: s.w,
          h: s.h,
          publishedAt: storePublishedMap.get(s.slug) ?? null,
        },
      });
    }

    // 4. Recreate cameras
    for (const c of cameras) {
      const zoneDbId = c.zoneDbId ? zoneIdMap.get(c.zoneDbId) ?? null : null;
      await tx.camera.create({
        data: {
          mallId,
          floor,
          label: c.label,
          x: c.x,
          y: c.y,
          angleDeg: c.angleDeg ?? null,
          fovDeg: c.fovDeg ?? null,
          rangeM: c.rangeM ?? null,
          streamUrl: c.streamUrl ?? null,
          zoneDbId,
          active: c.active ?? true,
        },
      });
    }
  });

  // Check if any zone retained its published status
  const firstPublished = await prisma.floorplanZone.findFirst({
    where: { mallId, floor, publishedAt: { not: null } },
    select: { publishedAt: true },
  });

  return NextResponse.json({
    ok: true,
    count: { zones: zones.length, stores: stores.length, cameras: cameras.length },
    publishedAt: firstPublished?.publishedAt?.toISOString() ?? null,
  });
}
