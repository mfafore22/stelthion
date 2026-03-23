import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    select: {
      originZoneId: true,
      destinationZoneId: true,
      selectedZoneIds: true,
      mode: true,
      journeys: {
        include: { paths: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    sessions: job.journeys,
    originZoneId: job.originZoneId,
    destinationZoneId: job.destinationZoneId,
    selectedZoneIds: job.selectedZoneIds ? JSON.parse(job.selectedZoneIds) : [],
    mode: job.mode,
  });
}
