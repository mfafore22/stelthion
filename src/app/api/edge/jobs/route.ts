import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * GET /api/edge/jobs?status=PENDING — Fetch jobs for the edge device's mall.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const status = req.nextUrl.searchParams.get('status') ?? 'PENDING';

    const jobs = await prisma.analysisJob.findMany({
      where: {
        mallId: auth.mallId,
        status: status as 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED',
      },
      include: {
        camera: { select: { id: true, label: true, floor: true, streamUrl: true } },
        secondaryCamera: { select: { id: true, label: true, floor: true, streamUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge jobs fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch jobs' },
      { status: 500 },
    );
  }
}
