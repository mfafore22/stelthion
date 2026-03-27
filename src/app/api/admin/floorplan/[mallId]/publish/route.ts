import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mallId } = await params;
  const { floor } = await req.json();

  const now = new Date();

  await prisma.floorplanZone.updateMany({
    where: { mallId, floor },
    data: { publishedAt: now },
  });

  return NextResponse.json({ ok: true, publishedAt: now.toISOString() });
}