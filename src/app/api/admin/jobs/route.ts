import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { activeCustomerMallIds } from '@/lib/admin-customer';

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallIds = await activeCustomerMallIds();
  if (!mallIds) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  const jobs = await prisma.analysisJob.findMany({
    where: { mallId: { in: mallIds } },
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(jobs);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallIds = await activeCustomerMallIds();
  if (!mallIds) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  const { id, status } = await req.json();

  if (!id || !['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }

  const existing = await prisma.analysisJob.findUnique({
    where: { id },
    select: { mallId: true },
  });
  if (!existing || !mallIds.includes(existing.mallId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const job = await prisma.analysisJob.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(job);
}
