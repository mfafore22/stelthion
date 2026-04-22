import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

/**
 * GET /api/admin/jobs — List recent analysis jobs.
 *
 * Phase B.5 tenant scoping: previously returned every job across every
 * customer. Now filtered to jobs whose mall belongs to the calling
 * admin's customer.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.analysisJob.findMany({
    where: { mall: { customerId: session.user.customerId } },
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(jobs);
}

/**
 * PATCH /api/admin/jobs — Update a job's status.
 *
 * Phase B.5 tenant scoping: previously updated any job by id without
 * verifying ownership. Now we look up the job's mall and reject if
 * it does not belong to the calling admin's customer.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await req.json();

  if (!id || !['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }

  const existing = await prisma.analysisJob.findUnique({
    where: { id },
    select: { mall: { select: { customerId: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  if (existing.mall.customerId !== session.user.customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const job = await prisma.analysisJob.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(job);
}
