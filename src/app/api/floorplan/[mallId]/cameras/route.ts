import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;

  const cameras = await prisma.camera.findMany({
    where: { mallId, active: true },
    orderBy: { label: 'asc' },
  });

  return NextResponse.json(
    cameras.map((c) => ({
      id: c.id,
      label: c.label,
      floor: c.floor,
      x: c.x,
      y: c.y,
    })),
  );
}
