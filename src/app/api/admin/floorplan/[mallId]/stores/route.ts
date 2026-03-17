import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const floor = new URL(_req.url).searchParams.get('floor') ?? 'ground';

  const stores = await prisma.floorplanStore.findMany({
    where: { mallId, floor },
    include: { zone: { select: { zoneId: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(
    stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      zoneId: s.zone.zoneId,
      zoneDbId: s.zoneDbId,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
    })),
  );
}
