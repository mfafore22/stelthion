import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      camera: { select: { label: true, floor: true } },
      secondaryCamera: { select: { label: true, floor: true } },
      results: { orderBy: [{ hour: 'asc' }, { zoneId: 'asc' }] },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
