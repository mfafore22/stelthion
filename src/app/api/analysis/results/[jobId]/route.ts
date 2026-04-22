/**
 * GET /api/analysis/results/[jobId]
 *
 * Phase D — analysis group migration. Pre-Phase-D this route was
 * session-gated but did NOT validate that the calling tenant owned the
 * job — any authenticated user could read another tenant's analysis
 * results by guessing the cuid. requireJobOwnership now enforces the
 * scope check.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireJobOwnership } from '@/server/api/tenant-guards';

const paramsSchema = z.object({ jobId: z.string() });

export const GET = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ params, auth: session }) => {
    await requireJobOwnership(session, params.jobId);

    const job = await prisma.analysisJob.findUnique({
      where: { id: params.jobId },
      include: {
        camera: { select: { label: true, floor: true } },
        secondaryCamera: { select: { label: true, floor: true } },
        results: { orderBy: [{ hour: 'asc' }, { zoneId: 'asc' }] },
      },
    });

    // requireJobOwnership already 404'd if the job is gone; this is a
    // belt-and-suspenders check in case of a race.
    if (!job) throw new HttpError(404, 'Job not found');

    return job;
  },
);
