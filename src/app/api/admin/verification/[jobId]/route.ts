import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/verification/[jobId]
 * Returns job details + snapshots grouped by anonymousTagId + existing reviews.
 * S3 pre-signed URLs would be generated here in production (stubbed for now).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      camera: { select: { label: true, floor: true } },
      secondaryCamera: { select: { label: true, floor: true } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Fetch all snapshots for this job
  const snapshots = await prisma.verificationSnapshot.findMany({
    where: { jobId },
    orderBy: [{ anonymousTagId: 'asc' }, { sequenceIndex: 'asc' }],
  });

  // Fetch all existing reviews for this job
  const reviews = await prisma.verificationReview.findMany({
    where: { jobId },
  });

  // Group snapshots by anonymousTagId
  const grouped: Record<string, typeof snapshots> = {};
  for (const snap of snapshots) {
    if (!grouped[snap.anonymousTagId]) {
      grouped[snap.anonymousTagId] = [];
    }
    grouped[snap.anonymousTagId].push(snap);
  }

  // Build individuals array with their snapshots and review status
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

  return NextResponse.json({
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
  });
}

/**
 * POST /api/admin/verification/[jobId]
 * Submit a verification verdict for a tracked individual.
 * Body: { anonymousTagId, verdict: "match"|"mismatch"|"unsure", notes? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { jobId } = await params;
  const { anonymousTagId, verdict, notes } = await req.json();

  if (!anonymousTagId || !['match', 'mismatch', 'unsure'].includes(verdict)) {
    return NextResponse.json(
      { error: 'anonymousTagId and valid verdict (match|mismatch|unsure) required' },
      { status: 400 },
    );
  }

  // Verify job exists
  const job = await prisma.analysisJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Upsert review (one review per tag per reviewer)
  const review = await prisma.verificationReview.upsert({
    where: {
      jobId_anonymousTagId_reviewedBy: {
        jobId,
        anonymousTagId,
        reviewedBy: guard.session.user.id,
      },
    },
    create: {
      jobId,
      anonymousTagId,
      reviewedBy: guard.session.user.id,
      verdict,
      notes: notes ?? null,
    },
    update: {
      verdict,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ ok: true, review });
}
