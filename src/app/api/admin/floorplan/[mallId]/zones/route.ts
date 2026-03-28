import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { mallId } = await params;
  const floor = new URL(_req.url).searchParams.get('floor') ?? 'ground';

  const zones = await prisma.floorplanZone.findMany({
    where: { mallId, floor },
    orderBy: { zoneId: 'asc' },
  });

  return NextResponse.json(
    zones.map((z) => ({
      id: z.id,
      zoneId: z.zoneId,
      name: z.name,
      nameFi: z.nameFi,
      category: z.category,
      subcategory: z.subcategory,
      drawShape: z.drawShape,
      svgPoints: z.svgPoints,
      labelX: z.labelX,
      labelY: z.labelY,
      capacity: z.capacity,
      areaSqm: z.areaSqm,
      baseVisitors: z.baseVisitors,
      publishedAt: z.publishedAt,
    })),
  );
}
