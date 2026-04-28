import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { currentUserMallIds } from '@/lib/admin-customer';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    select: {
      mallId: true,
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

  const allowedMallIds = await currentUserMallIds();
  if (!allowedMallIds || !allowedMallIds.includes(job.mallId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    sessions: job.journeys,
    originZoneId: job.originZoneId,
    destinationZoneId: job.destinationZoneId,
    selectedZoneIds: job.selectedZoneIds ? JSON.parse(job.selectedZoneIds) : [],
    mode: job.mode,
  });
}
