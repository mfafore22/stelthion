import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    select: { originZoneId: true, destinationZoneId: true },
  });

  const sessions = await prisma.journeySession.findMany({
    where: { jobId },
    include: { paths: true },
  });

  if (sessions.length === 0) {
    return NextResponse.json({ error: 'No journey data for this job' }, { status: 404 });
  }

  return NextResponse.json({
    sessions,
    originZoneId: job?.originZoneId ?? null,
    destinationZoneId: job?.destinationZoneId ?? null,
  });
}
