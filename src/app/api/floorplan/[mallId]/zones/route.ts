import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;

  const zones = await prisma.floorplanZone.findMany({
    where: { mallId, publishedAt: { not: null } },
    orderBy: { zoneId: 'asc' },
  });

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
  const floors = zones.reduce<Record<string, ReturnType<typeof mapZone>[]>>((acc, zone) => {
    acc[zone.floor] = acc[zone.floor] ?? [];
    acc[zone.floor].push(mapZone(zone));
    return acc;
  }, {});

  return NextResponse.json({
    groundZones: zones.filter((z) => z.floor === 'ground').map(mapZone),
    upperZones: zones.filter((z) => z.floor === 'upper').map(mapZone),
    floors,
  });
}
