import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * PATCH /api/edge/jobs/[jobId]/status — Update job status and progress.
 * Body: { status: "PROCESSING"|"COMPLETE"|"FAILED", progress?: number, error?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId } = await params;
    const { status, progress, error: errorMessage } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    // Verify job belongs to this edge device's mall
    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, mallId: auth.mallId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updated = await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status,
        progress: progress ?? undefined,
        errorMessage: errorMessage ?? undefined,
        edgeDeviceId: auth.deviceId,
      },
    });

    return NextResponse.json({ ok: true, status: updated.status, progress: updated.progress });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge job status update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status update failed' },
      { status: 500 },
    );
  }
}
