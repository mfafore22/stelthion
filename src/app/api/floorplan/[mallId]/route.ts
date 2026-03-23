import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

  const [zones, cameras] = await Promise.all([
    prisma.floorplanZone.findMany({
      where: { mallId, floor, publishedAt: { not: null } },
      orderBy: { zoneId: 'asc' },
    }),
    prisma.camera.findMany({
      where: { mallId, floor, active: true },
      orderBy: { label: 'asc' },
    }),
  ]);

  // Map to IdeaparkZone shape expected by FootfallAnalysis
  const mappedZones = zones.map((z) => ({
    id: z.zoneId,
    name: z.name,
    nameFi: z.nameFi,
    category: z.category,
    subcategory: z.subcategory,
    drawShape: z.drawShape,
    area_sqm: z.areaSqm,
    svgPoints: z.svgPoints,
    capacity: z.capacity,
    baseVisitors: z.baseVisitors,
    labelX: z.labelX,
    labelY: z.labelY,
    locationPrefixes: [] as number[],
  }));

  const mappedCameras = cameras.map((c) => ({
    id: c.id,
    label: c.label,
    x: c.x,
    y: c.y,
    angleDeg: c.angleDeg,
    fovDeg: c.fovDeg,
    rangeM: c.rangeM,
    active: c.active,
  }));

  return NextResponse.json({
    zones: mappedZones,
    cameras: mappedCameras,
    entrances: [],
  });
}
