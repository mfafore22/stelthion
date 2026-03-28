import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const jobs = await prisma.analysisJob.findMany({
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(jobs);
}

export async function PATCH(req: NextRequest) {
  const guard2 = await requireAdmin();
  if ('error' in guard2) return guard2.error;

  const { id, status } = await req.json();

  if (!id || !['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }

  const job = await prisma.analysisJob.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(job);
}
