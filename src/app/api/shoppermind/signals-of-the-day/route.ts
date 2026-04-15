import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const url = new URL(req.url);
  const country = url.searchParams.get('country');
  const limit = Math.min(30, Math.max(1, Number(url.searchParams.get('limit')) || 7));

  const entries = await prisma.signalOfTheDay.findMany({
    where: country ? { country } : undefined,
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json(entries);
}
