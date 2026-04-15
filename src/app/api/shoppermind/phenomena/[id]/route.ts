import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const phenomenon = await prisma.phenomenon.findUnique({
    where: { id },
    include: {
      scores: { orderBy: { date: 'desc' }, take: 28 },
      signals: {
        orderBy: { publishedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          url: true,
          publishedAt: true,
          source: { select: { name: true, type: true } },
        },
      },
      feedback: { orderBy: { createdAt: 'desc' }, take: 50 },
      _count: { select: { signals: true, feedback: true } },
    },
  });

  if (!phenomenon) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(phenomenon);
}
