import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.analysisJob.findMany({
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(jobs);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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