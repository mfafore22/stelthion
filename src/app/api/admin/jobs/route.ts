import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  const jobs = await prisma.analysisJob.findMany({
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(jobs);
}

export async function PATCH(req: NextRequest) {
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
