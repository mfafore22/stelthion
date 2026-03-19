import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

  const zones = await prisma.floorplanZone.findMany({
    where: { mallId, floor, publishedAt: { not: null } },
    orderBy: { zoneId: 'asc' },
  });

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

  return NextResponse.json({
    zones: mappedZones,
    entrances: [],
  });
}
