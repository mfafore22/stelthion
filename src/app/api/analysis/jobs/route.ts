/**
 * /api/analysis/jobs — list + create analysis jobs.
 *
 * Phase D — analysis group migration. The tenant-scoping checks landed
 * in B.5 are preserved bytewise; the only structural change is that the
 * try/catch + auth + 401-shaping is now done by defineHandler, and
 * mall-ownership is delegated to the requireMallOwnership helper.
 *
 * Tenant scoping
 * --------------
 *   - GET with mallId: validates ownership, 403 on mismatch, 404 on miss.
 *   - GET without mallId: scopes findMany to mall.customerId of session.
 *   - POST: validates mallId ownership before creating the job.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';
import * as analysisJobRepo from '@/server/repositories/analysis-job';

const VALID_JOURNEY_COUNTS = [1, 5, 10, 15, 20] as const;
const VALID_MODES = ['ZONE_COUNT', 'AB_TRACKING', 'JOURNEY_MAP', 'STORE_BEHAVIOR'] as const;

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'session' },
  async ({ req, auth: session }) => {
    const { searchParams } = new URL(req.url);
    const mallId = searchParams.get('mallId');
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');

    if (mallId) {
      await requireMallOwnership(session, mallId);
    }

    const where: Record<string, unknown> = {};
    if (mallId) where.mallId = mallId;
    if (status) where.status = status;
    if (mode && (VALID_MODES as readonly string[]).includes(mode)) where.mode = mode;
    if (type === 'journey-planner') where.originZoneId = { not: null };

    // listForCaller always injects `mall.customerId === caller`, so we
    // don't need the explicit fall-through that B.5 added here — the
    // repo makes the safe path the only path.
    return await analysisJobRepo.listForCaller(session, {
      where,
      include: {
        camera: { select: { id: true, label: true, floor: true } },
        secondaryCamera: { select: { id: true, label: true, floor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },
);

// ─── POST ───────────────────────────────────────────────────────────

const createJobSchema = z.object({
  mallId: z.string().min(1),
  mode: z.enum(VALID_MODES).default('ZONE_COUNT'),
  cameraId: z.string().optional(),
  secondaryCameraId: z.string().optional(),
  footageDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  journeyCount: z.number().int().default(0),
  requestedBy: z.string().min(1),
  originZoneId: z.string().optional(),
  destinationZoneId: z.string().optional(),
  selectedZoneIds: z.array(z.string()).optional(),
});

export const POST = defineHandler(
  { auth: 'session', bodySchema: createJobSchema },
  async ({ body, auth: session }) => {
    await requireMallOwnership(session, body.mallId);

    if (body.mode === 'ZONE_COUNT') {
      if (!body.cameraId) {
        throw new HttpError(400, 'cameraId required for ZONE_COUNT');
      }
    } else if (body.mode === 'AB_TRACKING') {
      if (!body.cameraId || !body.secondaryCameraId) {
        throw new HttpError(400, 'cameraId and secondaryCameraId required for AB_TRACKING');
      }
      if (!(VALID_JOURNEY_COUNTS as readonly number[]).includes(body.journeyCount)) {
        throw new HttpError(400, 'journeyCount must be 1, 5, 10, 15, or 20');
      }
    } else if (body.mode === 'JOURNEY_MAP') {
      if (!body.selectedZoneIds || body.selectedZoneIds.length < 2) {
        throw new HttpError(400, 'At least 2 selectedZoneIds required for JOURNEY_MAP');
      }
      if (!(VALID_JOURNEY_COUNTS as readonly number[]).includes(body.journeyCount)) {
        throw new HttpError(400, 'journeyCount must be 1, 5, 10, 15, or 20');
      }
    } else if (body.mode === 'STORE_BEHAVIOR') {
      if (!body.cameraId) {
        throw new HttpError(400, 'cameraId required for STORE_BEHAVIOR');
      }
      if (!body.selectedZoneIds || body.selectedZoneIds.length < 1) {
        throw new HttpError(400, 'At least 1 selectedZoneId required for STORE_BEHAVIOR');
      }
    }

    if (body.cameraId) {
      const camera = await prisma.camera.findUnique({ where: { id: body.cameraId } });
      if (!camera) throw new HttpError(404, 'Camera not found');
    }
    if (body.secondaryCameraId) {
      const cam2 = await prisma.camera.findUnique({ where: { id: body.secondaryCameraId } });
      if (!cam2) throw new HttpError(404, 'Secondary camera not found');
    }

    const job = await prisma.analysisJob.create({
      data: {
        mallId: body.mallId,
        mode: body.mode,
        cameraId: body.cameraId ?? null,
        secondaryCameraId: body.secondaryCameraId ?? null,
        footageDate: new Date(body.footageDate),
        startTime: body.startTime,
        endTime: body.endTime,
        journeyCount: body.journeyCount,
        originZoneId: body.originZoneId ?? null,
        destinationZoneId: body.destinationZoneId ?? null,
        selectedZoneIds: body.selectedZoneIds ? JSON.stringify(body.selectedZoneIds) : null,
        requestedBy: body.requestedBy,
      },
    });

    return new Response(JSON.stringify(job), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  },
);
