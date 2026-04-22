/**
 * /api/admin/verification/[jobId]
 *
 * GET: returns job details + snapshots grouped by anonymousTagId + reviews.
 * POST: submit a verification verdict for a tracked individual.
 *
 * Phase D — admin group migration. Pre-Phase-D both verbs were
 * admin-gated but did NOT validate that the calling admin's customer
 * owned the job. The leak shape:
 *   - GET: cross-tenant snapshot read — exposes another tenant's
 *     verification image references and color signatures.
 *   - POST: cross-tenant verdict write — pollutes another tenant's
 *     re-ID training labels.
 * Both verbs are now gated by requireJobOwnership.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';
import { requireJobOwnership } from '@/server/api/tenant-guards';

const paramsSchema = z.object({ jobId: z.string() });

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ params, auth: session }) => {
    await requireJobOwnership(session, params.jobId);

    const { jobId } = params;

    // requireJobOwnership has already confirmed the job exists and
    // belongs to the caller. The handler's own findUnique loads the
    // full row needed for the response shape.
    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: {
        camera: { select: { label: true, floor: true } },
        secondaryCamera: { select: { label: true, floor: true } },
      },
    });
    // Belt-and-suspenders for races; requireJobOwnership 404'd above.
    if (!job) throw new Error('Unreachable: job missing after ownership check');

    const snapshots = await prisma.verificationSnapshot.findMany({
      where: { jobId },
      orderBy: [{ anonymousTagId: 'asc' }, { sequenceIndex: 'asc' }],
    });

    const reviews = await prisma.verificationReview.findMany({
      where: { jobId },
    });

    const grouped: Record<string, typeof snapshots> = {};
    for (const snap of snapshots) {
      if (!grouped[snap.anonymousTagId]) {
        grouped[snap.anonymousTagId] = [];
      }
      grouped[snap.anonymousTagId].push(snap);
    }

    const individuals = Object.entries(grouped).map(([tagId, tagSnapshots]) => {
      const review = reviews.find((r) => r.anonymousTagId === tagId);
      return {
        anonymousTagId: tagId,
        snapshots: tagSnapshots.map((s) => ({
          id: s.id,
          cameraId: s.cameraId,
          zoneId: s.zoneId,
          capturedAt: s.capturedAt.toISOString(),
          s3Key: s.s3Key,
          // In production: generate pre-signed S3 URL here
          imageUrl: `/api/admin/verification/${jobId}/image/${s.id}`,
          colorSignature: s.colorSignature,
          sequenceIndex: s.sequenceIndex,
        })),
        review: review
          ? {
              verdict: review.verdict,
              notes: review.notes,
              reviewedBy: review.reviewedBy,
              createdAt: review.createdAt.toISOString(),
            }
          : null,
      };
    });

    const reviewedCount = individuals.filter((i) => i.review !== null).length;

    return {
      job: {
        id: job.id,
        mallId: job.mallId,
        mode: job.mode,
        footageDate: job.footageDate,
        startTime: job.startTime,
        endTime: job.endTime,
        sampleSize: job.sampleSize,
        status: job.status,
        camera: job.camera,
        secondaryCamera: job.secondaryCamera,
        originZoneId: job.originZoneId,
        destinationZoneId: job.destinationZoneId,
        selectedZoneIds: job.selectedZoneIds,
        createdAt: job.createdAt.toISOString(),
      },
      individuals,
      totalCount: individuals.length,
      reviewedCount,
    };
  },
);

// ─── POST ───────────────────────────────────────────────────────────

const verdictSchema = z.object({
  anonymousTagId: z.string().min(1),
  verdict: z.enum(['match', 'mismatch', 'unsure']),
  notes: z.string().optional(),
});

export const POST = defineHandler(
  { auth: 'admin', paramsSchema, bodySchema: verdictSchema },
  async ({ params, body, auth: session }) => {
    await requireJobOwnership(session, params.jobId);

    const review = await prisma.verificationReview.upsert({
      where: {
        jobId_anonymousTagId_reviewedBy: {
          jobId: params.jobId,
          anonymousTagId: body.anonymousTagId,
          reviewedBy: session.user.id,
        },
      },
      create: {
        jobId: params.jobId,
        anonymousTagId: body.anonymousTagId,
        reviewedBy: session.user.id,
        verdict: body.verdict,
        notes: body.notes ?? null,
      },
      update: {
        verdict: body.verdict,
        notes: body.notes ?? null,
      },
    });

    return { ok: true, review };
  },
);
