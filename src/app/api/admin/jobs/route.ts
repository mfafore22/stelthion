/**
 * /api/admin/jobs
 *
 * Phase D — admin group migration. The B.5 tenant-scoping checks are
 * preserved bytewise:
 *   - GET filters jobs whose mall belongs to the calling admin's customer.
 *   - PATCH validates job ownership via requireJobOwnership before update.
 *
 * Behaviour change worth noting: this route used to do its own role
 * check returning 401 for an authenticated-non-ADMIN. Migrating to
 * `auth: 'admin'` standardizes on requireAdmin's 403 for authenticated
 * non-admins (and 401 for unauthenticated). All other admin routes
 * already use this convention.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireJobOwnership } from '@/server/api/tenant-guards';

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => {
    return await prisma.analysisJob.findMany({
      where: { mall: { customerId: session.user.customerId } },
      include: { camera: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },
);

// ─── PATCH ──────────────────────────────────────────────────────────

const VALID_STATUS = ['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'] as const;

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(VALID_STATUS),
});

export const PATCH = defineHandler(
  { auth: 'admin', bodySchema: patchSchema },
  async ({ body, auth: session }) => {
    await requireJobOwnership(session, body.id);

    const job = await prisma.analysisJob.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    if (!job) throw new HttpError(404, 'Job not found');

    return job;
  },
);
