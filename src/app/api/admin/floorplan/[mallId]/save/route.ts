import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

/**
 * Combined atomic save — zones and cameras in one transaction.
 * Prevents cascading data loss from separate sequential requests.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const { floor, zones, cameras } = await req.json();

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

    // 1. Delete in FK-safe order: cameras → zones
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
          subcategory: z.subcategory ?? null,
          drawShape: z.drawShape ?? 'polygon',
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

    // 3. Recreate cameras
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
    count: { zones: zones.length, cameras: cameras.length },
    publishedAt: firstPublished?.publishedAt?.toISOString() ?? null,
  });
}
