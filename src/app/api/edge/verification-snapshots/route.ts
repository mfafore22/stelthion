import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/verification-snapshots — Receive anonymized silhouette snapshot metadata from edge.
 * The actual silhouette images are pushed directly to S3 by the edge device.
 * This endpoint registers the metadata so the admin verification UI can reference them.
 *
 * Body: { jobId, snapshots: [{ anonymousTagId, cameraId, zoneId, capturedAt, s3Key, colorSignature, sequenceIndex }] }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId, snapshots } = await req.json();

    if (!jobId || !Array.isArray(snapshots) || snapshots.length === 0) {
      return NextResponse.json(
        { error: 'jobId and non-empty snapshots array are required' },
        { status: 400 },
      );
    }

    // Verify job belongs to this mall
    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, mallId: auth.mallId },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Batch-create snapshot metadata rows
    let inserted = 0;
    for (const s of snapshots) {
      if (!s.anonymousTagId || !s.cameraId || !s.zoneId || !s.s3Key || !s.colorSignature) {
        continue;
      }

      await prisma.verificationSnapshot.create({
        data: {
          jobId,
          anonymousTagId: s.anonymousTagId,
          cameraId: s.cameraId,
          zoneId: s.zoneId,
          capturedAt: new Date(s.capturedAt),
          s3Key: s.s3Key,
          colorSignature: typeof s.colorSignature === 'string'
            ? s.colorSignature
            : JSON.stringify(s.colorSignature),
          sequenceIndex: s.sequenceIndex ?? 0,
        },
      });
      inserted++;
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge verification-snapshots error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Snapshot ingestion failed' },
      { status: 500 },
    );
  }
}
