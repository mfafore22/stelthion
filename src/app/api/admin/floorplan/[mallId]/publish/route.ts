import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const { floor } = await req.json();

  const now = new Date();

  await prisma.floorplanZone.updateMany({
    where: { mallId, floor },
    data: { publishedAt: now },
  });

  await prisma.floorplanStore.updateMany({
    where: { mallId, floor },
    data: { publishedAt: now },
  });

  return NextResponse.json({ ok: true, publishedAt: now.toISOString() });
}
