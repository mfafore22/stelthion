import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mallId } = await params;

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

    await prisma.$transaction(async (tx) => {
      const existingZones = await tx.floorplanZone.findMany({
        where: { mallId, floor },
        select: { zoneId: true, publishedAt: true },
      });
      const zonePublishedMap = new Map(
        existingZones.map((z) => [z.zoneId, z.publishedAt]),
      );

      await tx.camera.deleteMany({ where: { mallId, floor } });
      await tx.floorplanZone.deleteMany({ where: { mallId, floor } });

      for (const z of zones) {
        await tx.floorplanZone.create({
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
      }

      for (const c of cameras) {
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