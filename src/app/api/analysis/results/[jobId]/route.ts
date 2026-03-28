import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      camera: { select: { label: true, floor: true } },
      secondaryCamera: { select: { label: true, floor: true } },
      results: { orderBy: [{ hour: 'asc' }, { zoneId: 'asc' }] },
      behaviors: { orderBy: [{ hour: 'asc' }, { zoneId: 'asc' }] },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
