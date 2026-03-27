import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mallId } = await params;
  const floor = new URL(_req.url).searchParams.get('floor') ?? 'ground';

  const cameras = await prisma.camera.findMany({
    where: { mallId, floor },
    orderBy: { label: 'asc' },
  });

  return NextResponse.json(
    cameras.map((c) => ({
      id: c.id,
      label: c.label,
      x: c.x,
      y: c.y,
      angleDeg: c.angleDeg,
      fovDeg: c.fovDeg,
      rangeM: c.rangeM,
      streamUrl: c.streamUrl,
      zoneDbId: c.zoneDbId,
      active: c.active,
    })),
  );
}