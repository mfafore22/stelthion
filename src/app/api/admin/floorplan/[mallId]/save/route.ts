import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Combined atomic save — zones and cameras in one transaction.
 * Includes safeguards against accidental bulk deletion.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { mallId } = await params;

  try {
    const { floor, zones, cameras, confirmBulkDelete } = await req.json();

    if (!Array.isArray(zones) || !Array.isArray(cameras)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload: zones and cameras must be arrays.' },
        { status: 400 },
      );
    }

    // ── Safeguard: require explicit confirmation for large deletions ──
    if (!confirmBulkDelete) {
      const existingZoneCount = await prisma.floorplanZone.count({ where: { mallId, floor } });
      const existingCameraCount = await prisma.camera.count({ where: { mallId, floor } });
      const zonesDelta = existingZoneCount - zones.length;

      if (existingZoneCount > 0 && zones.length === 0) {
        return NextResponse.json(
          { ok: false, needsConfirmation: true, error: `This will delete all ${existingZoneCount} zones. Save again to confirm.` },
          { status: 409 },
        );
      }

      if (existingZoneCount > 4 && zonesDelta > existingZoneCount * 0.5) {
        return NextResponse.json(
          { ok: false, needsConfirmation: true, error: `This will remove ${zonesDelta} of ${existingZoneCount} zones. Save again to confirm.` },
          { status: 409 },
        );
      }

      if (existingCameraCount > 0 && cameras.length === 0) {
        return NextResponse.json(
          { ok: false, needsConfirmation: true, error: `This will delete all ${existingCameraCount} cameras. Save again to confirm.` },
          { status: 409 },
        );
      }
    }

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

      // 3. Recreate cameras
      for (const c of cameras) {
        await tx.camera.create({
          data: {
            mallId,
            floor,
            deviceType: c.deviceType ?? 'camera',
            label: c.label,
            x: c.x,
            y: c.y,
            model: c.model ?? null,
            resolution: c.resolution ?? null,
            lensInfo: c.lensInfo ?? null,
            cameraRole: c.cameraRole ?? null,
            angleDeg: c.angleDeg ?? null,
            fovDeg: c.fovDeg ?? null,
            rangeM: c.rangeM ?? null,
            streamUrl: c.streamUrl ?? null,
            dataSourceUrl: c.dataSourceUrl ?? null,
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
  } catch (error) {
    console.error('Floorplan save error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 },
    );
  }
}
