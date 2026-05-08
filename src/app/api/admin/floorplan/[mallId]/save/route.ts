import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireMallAccess } from '@/lib/admin-customer';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const guard = await requireMallAccess(mallId);
  if ('error' in guard) return guard.error;

  try {
    const { floor, zones, cameras } = await req.json();

    const existingZoneCount = await prisma.floorplanZone.count({ where: { mallId, floor } });
    const existingCameraCount = await prisma.camera.count({ where: { mallId, floor } });

    if (existingZoneCount > 0 && (!Array.isArray(zones) || zones.length === 0)) {
      return NextResponse.json(
        { ok: false, error: `Refused: save would delete all ${existingZoneCount} zones. Zones array is empty.` },
        { status: 400 },
      );
    }

    if (!Array.isArray(zones) || !Array.isArray(cameras)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload: zones and cameras must be arrays.' },
        { status: 400 },
      );
    }

    if (existingZoneCount > 4 && zones.length < existingZoneCount * 0.5) {
      return NextResponse.json(
        { ok: false, error: `Refused: save would reduce zones from ${existingZoneCount} to ${zones.length} (>50% loss). Delete zones individually instead.` },
        { status: 400 },
      );
    }

    if (existingCameraCount > 0 && cameras.length === 0) {
      return NextResponse.json(
        { ok: false, error: `Refused: save would delete all ${existingCameraCount} cameras. Camera array is empty.` },
        { status: 400 },
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
    // If ANY existing zone was published, the floorplan is in "published" state.
    // New/renamed zones must inherit that state — otherwise editing zone IDs
    // silently unpublishes them from the /mall view.
    const wasPublished = existingZones.some((z) => z.publishedAt !== null);
    const latestPublishedAt = wasPublished
      ? existingZones.reduce<Date | null>(
          (max, z) =>
            z.publishedAt && (!max || z.publishedAt > max) ? z.publishedAt : max,
          null,
        )
      : null;

    const incomingZoneIds = zones.map((z: any) => z.zoneId as string);

    // Entire save is atomic: if any write fails, nothing is lost.
    await prisma.$transaction(async (tx) => {
      // Upsert every zone in the incoming set — never blindly delete first.
      for (const z of zones) {
        await tx.floorplanZone.upsert({
          where: { mallId_floor_zoneId: { mallId, floor, zoneId: z.zoneId } },
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
          },
        });
      }

      // Only remove zones the editor explicitly deleted (not in incoming set).
      await tx.floorplanZone.deleteMany({
        where: { mallId, floor, zoneId: { notIn: incomingZoneIds } },
      });

      // Cameras have no stable unique key — replace only the ones for this floor.
      await tx.camera.deleteMany({ where: { mallId, floor } });
      for (const c of cameras) {
        await tx.camera.create({
          data: {
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
        });
      }
    });

    const firstPublished = await prisma.floorplanZone.findFirst({
      where: { mallId, floor, publishedAt: { not: null } },
      select: { publishedAt: true },
    });

    return NextResponse.json({
      ok: true,
      count: { zones: zones.length, cameras: cameras.length },
      publishedAt: firstPublished?.publishedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Floorplan save error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 },
    );
  }
}