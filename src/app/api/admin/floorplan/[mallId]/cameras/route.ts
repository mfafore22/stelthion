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

  const cameras = await prisma.camera.findMany({
    where: { mallId, floor },
    orderBy: { label: 'asc' },
  });

  return NextResponse.json(
    cameras.map((c) => ({
      id: c.id,
      deviceType: c.deviceType,
      label: c.label,
      x: c.x,
      y: c.y,
      angleDeg: c.angleDeg,
      fovDeg: c.fovDeg,
      rangeM: c.rangeM,
      streamUrl: c.streamUrl,
      dataSourceUrl: c.dataSourceUrl,
      zoneDbId: c.zoneDbId,
      active: c.active,
    })),
  );
}
