import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as floorplanRepo from '@/server/repositories/floorplan';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mallId } = await params;
    const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

    const [zones, cameras] = await Promise.all([
      floorplanRepo.listPublishedZonesForMallUnscoped(mallId, floor),
      floorplanRepo.listActiveCamerasForMallUnscoped(mallId, floor),
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
      deviceType: c.deviceType,
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
  } catch (err) {
    console.error('[floorplan API]', err);
    return NextResponse.json({ zones: [], cameras: [], entrances: [], error: String(err) }, { status: 500 });
  }
}
