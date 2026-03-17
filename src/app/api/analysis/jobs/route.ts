import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

const VALID_JOURNEY_COUNTS = [1, 5, 10, 15, 20];

export async function GET(req: NextRequest) {
  const mallId = new URL(req.url).searchParams.get('mallId');
  const status = new URL(req.url).searchParams.get('status');

  const type = new URL(req.url).searchParams.get('type');

  const where: Record<string, unknown> = {};
  if (mallId) where.mallId = mallId;
  if (status) where.status = status;
  if (type === 'journey-planner') where.originZoneId = { not: null };

  const jobs = await prisma.analysisJob.findMany({
    where,
    include: { camera: { select: { id: true, label: true, floor: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mallId, cameraId, footageDate, startTime, endTime, journeyCount, requestedBy, originZoneId, destinationZoneId } = body;

  if (!mallId || !cameraId || !footageDate || !startTime || !endTime || !requestedBy) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!VALID_JOURNEY_COUNTS.includes(journeyCount)) {
    return NextResponse.json({ error: 'journeyCount must be 1, 5, 10, 15, or 20' }, { status: 400 });
  }

  // Verify camera exists
  const camera = await prisma.camera.findUnique({ where: { id: cameraId } });
  if (!camera) {
    return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
  }

  const job = await prisma.analysisJob.create({
    data: {
      mallId,
      cameraId,
      footageDate: new Date(footageDate),
      startTime,
      endTime,
      journeyCount,
      originZoneId: originZoneId ?? null,
      destinationZoneId: destinationZoneId ?? null,
      requestedBy,
    },
  });

  return NextResponse.json(job, { status: 201 });
}
