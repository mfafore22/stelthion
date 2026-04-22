import { NextRequest, NextResponse } from 'next/server';
import * as floorplanRepo from '@/server/repositories/floorplan';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;

  const zones = await floorplanRepo.listPublishedZonesForMallUnscoped(mallId);

  const mapZone = (z: typeof zones[number]) => ({
    id: z.zoneId,
    zoneId: z.zoneId,
    name: z.name,
    nameFi: z.nameFi,
    floor: z.floor,
    category: z.category,
    svgPoints: z.svgPoints,
    labelX: z.labelX,
    labelY: z.labelY,
    capacity: z.capacity,
    areaSqm: z.areaSqm,
  });

  return NextResponse.json({
    groundZones: zones.filter((z) => z.floor === 'ground').map(mapZone),
    upperZones: zones.filter((z) => z.floor === 'upper').map(mapZone),
  });
}
