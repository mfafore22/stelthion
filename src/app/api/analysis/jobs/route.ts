import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

const VALID_JOURNEY_COUNTS = [1, 5, 10, 15, 20];
const VALID_MODES = ['ZONE_COUNT', 'AB_TRACKING', 'JOURNEY_MAP', 'STORE_BEHAVIOR'] as const;

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  const status = searchParams.get('status');
  const mode = searchParams.get('mode');
  const type = searchParams.get('type'); // backward compat

  const where: Record<string, unknown> = {};
  if (mallId) where.mallId = mallId;
  if (status) where.status = status;
  if (mode && VALID_MODES.includes(mode as typeof VALID_MODES[number])) where.mode = mode;
  if (type === 'journey-planner') where.originZoneId = { not: null };

  const jobs = await prisma.analysisJob.findMany({
    where,
    include: {
      camera: { select: { id: true, label: true, floor: true } },
      secondaryCamera: { select: { id: true, label: true, floor: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json();
  const {
    mallId, mode = 'ZONE_COUNT', cameraId, secondaryCameraId,
    footageDate, startTime, endTime, journeyCount = 0,
    requestedBy, originZoneId, destinationZoneId, selectedZoneIds,
  } = body;

  if (!mallId || !footageDate || !startTime || !endTime || !requestedBy) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  // Mode-specific validation
  if (mode === 'ZONE_COUNT') {
    if (!cameraId) {
      return NextResponse.json({ error: 'cameraId required for ZONE_COUNT' }, { status: 400 });
    }
  } else if (mode === 'AB_TRACKING') {
    if (!cameraId || !secondaryCameraId) {
      return NextResponse.json({ error: 'cameraId and secondaryCameraId required for AB_TRACKING' }, { status: 400 });
    }
    if (!VALID_JOURNEY_COUNTS.includes(journeyCount)) {
      return NextResponse.json({ error: 'journeyCount must be 1, 5, 10, 15, or 20' }, { status: 400 });
    }
  } else if (mode === 'JOURNEY_MAP') {
    if (!selectedZoneIds || !Array.isArray(selectedZoneIds) || selectedZoneIds.length < 2) {
      return NextResponse.json({ error: 'At least 2 selectedZoneIds required for JOURNEY_MAP' }, { status: 400 });
    }
    if (!VALID_JOURNEY_COUNTS.includes(journeyCount)) {
      return NextResponse.json({ error: 'journeyCount must be 1, 5, 10, 15, or 20' }, { status: 400 });
    }
  } else if (mode === 'STORE_BEHAVIOR') {
    if (!cameraId) {
      return NextResponse.json({ error: 'cameraId required for STORE_BEHAVIOR' }, { status: 400 });
    }
    if (!selectedZoneIds || !Array.isArray(selectedZoneIds) || selectedZoneIds.length < 1) {
      return NextResponse.json({ error: 'At least 1 selectedZoneId required for STORE_BEHAVIOR' }, { status: 400 });
    }
  }

  // Verify cameras exist
  if (cameraId) {
    const camera = await prisma.camera.findUnique({ where: { id: cameraId } });
    if (!camera) return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
  }
  if (secondaryCameraId) {
    const cam2 = await prisma.camera.findUnique({ where: { id: secondaryCameraId } });
    if (!cam2) return NextResponse.json({ error: 'Secondary camera not found' }, { status: 404 });
  }

  const job = await prisma.analysisJob.create({
    data: {
      mallId,
      mode,
      cameraId: cameraId ?? null,
      secondaryCameraId: secondaryCameraId ?? null,
      footageDate: new Date(footageDate),
      startTime,
      endTime,
      journeyCount,
      originZoneId: originZoneId ?? null,
      destinationZoneId: destinationZoneId ?? null,
      selectedZoneIds: selectedZoneIds ? JSON.stringify(selectedZoneIds) : null,
      requestedBy,
    },
  });

  return NextResponse.json(job, { status: 201 });
}
