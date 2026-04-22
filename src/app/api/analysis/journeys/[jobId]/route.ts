/**
 * GET /api/analysis/journeys/[jobId]
 *
 * Phase D — analysis group migration. Pre-Phase-D this route was
 * session-gated but did NOT validate that the calling tenant owned the
 * job — cross-tenant journey reads were possible by jobId-guess. Now
 * gated by requireJobOwnership.
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

    if (!job) throw new HttpError(404, 'Job not found');

    return {
      sessions: job.journeys,
      originZoneId: job.originZoneId,
      destinationZoneId: job.destinationZoneId,
      selectedZoneIds: job.selectedZoneIds ? JSON.parse(job.selectedZoneIds) : [],
      mode: job.mode,
    };
  },
);
