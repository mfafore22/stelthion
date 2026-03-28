import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { mallId } = await params;
  const { floor } = await req.json();

  const now = new Date();

  await prisma.floorplanZone.updateMany({
    where: { mallId, floor },
    data: { publishedAt: now },
  });

  return NextResponse.json({ ok: true, publishedAt: now.toISOString() });
}
