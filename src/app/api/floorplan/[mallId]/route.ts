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
    include: {
      stores: { where: { publishedAt: { not: null } } },
    },
    orderBy: { zoneId: 'asc' },
  });

  // Map to IdeaparkZone / StorePosition shapes expected by FootfallAnalysis
  const mappedZones = zones.map((z) => ({
    id: z.zoneId,
    name: z.name,
    nameFi: z.nameFi,
    category: z.category,
    area_sqm: z.areaSqm,
    svgPoints: z.svgPoints,
    capacity: z.capacity,
    baseVisitors: z.baseVisitors,
    labelX: z.labelX,
    labelY: z.labelY,
    locationPrefixes: [] as number[],
  }));

  const mappedStores = zones.flatMap((z) =>
    z.stores.map((s) => ({
      name: s.name,
      slug: s.slug,
      zoneId: z.zoneId,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
    })),
  );

  return NextResponse.json({
    zones: mappedZones,
    stores: mappedStores,
    entrances: [],
  });
}
