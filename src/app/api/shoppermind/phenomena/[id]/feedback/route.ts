import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { recalculateWeights } from '@/services/shoppermind/weights';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const body = (await req.json()) as { verdict: string; note?: string; userId: string };

  if (!body.verdict || !body.userId) {
    return NextResponse.json({ error: 'verdict and userId required' }, { status: 400 });
  }

  const phenomenon = await prisma.phenomenon.findUnique({ where: { id } });
  if (!phenomenon) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const feedback = await prisma.phenomenonFeedback.create({
    data: {
      phenomenonId: id,
      userId: body.userId,
      verdict: body.verdict,
      note: body.note,
    },
  });

  recalculateWeights(phenomenon.primaryCountry).catch(() => {});

  return NextResponse.json(feedback);
}
