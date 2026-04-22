import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';

const VALID_JOURNEY_COUNTS = [1, 5, 10, 15, 20];
const VALID_MODES = ['ZONE_COUNT', 'AB_TRACKING', 'JOURNEY_MAP', 'STORE_BEHAVIOR'] as const;

/**
 * GET /api/analysis/jobs — List analysis jobs scoped to the caller's tenant.
 *
 * Phase B.5 tenant scoping:
 *   - When mallId is supplied: validates the mall belongs to the caller's
 *     customer, returns 403 otherwise.
 *   - When mallId is omitted: results are filtered to jobs whose mall
 *     belongs to the caller's customer (previously returned all jobs
 *     across all customers).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  const status = searchParams.get('status');
  const mode = searchParams.get('mode');
  const type = searchParams.get('type');

  // If mallId is supplied, verify ownership before querying.
  if (mallId) {
    const mall = await prisma.mall.findUnique({
      where: { mallId },
      select: { customerId: true },
    });
    if (!mall) return NextResponse.json({ error: 'Mall not found' }, { status: 404 });
    if (mall.customerId !== session.user.customerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const where: Record<string, unknown> = {};
  if (mallId) {
    where.mallId = mallId;
  } else {
    // No explicit mallId — scope to all malls owned by the caller's customer.
    where.mall = { customerId: session.user.customerId };
  }
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

/**
 * POST /api/analysis/jobs — Create a new analysis job for a mall.
 *
 * Phase B.5 tenant scoping: validates mallId belongs to the caller's
 * customer before creating the job. Previously trusted client-supplied
 * mallId, allowing a tenant user to create jobs against another
 * tenant's mall.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    mallId, mode = 'ZONE_COUNT', cameraId, secondaryCameraId,
    footageDate, startTime, endTime, journeyCount = 0,
    requestedBy, originZoneId, destinationZoneId, selectedZoneIds,
  } = body;

  if (!mallId || !footageDate || !startTime || !endTime || !requestedBy) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify mall ownership before doing any further work.
  const mall = await prisma.mall.findUnique({
    where: { mallId },
    select: { customerId: true },
  });
  if (!mall) return NextResponse.json({ error: 'Mall not found' }, { status: 404 });
  if (mall.customerId !== session.user.customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

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
