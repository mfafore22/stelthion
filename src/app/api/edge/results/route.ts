import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/results — Receive ZONE_COUNT hourly results from edge.
 * Body: { jobId, results: [{ zoneId, hour, count, density }] }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId, results } = await req.json();

    if (!jobId || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'jobId and results array are required' },
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

    // Upsert results (idempotent)
    let inserted = 0;
    for (const r of results) {
      if (!r.zoneId || r.hour == null || r.count == null) continue;

      await prisma.analysisResult.create({
        data: {
          jobId,
          zoneId: r.zoneId,
          hour: r.hour,
          count: r.count,
          density: r.density ?? 0,
        },
      });
      inserted++;
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge results error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Results ingestion failed' },
      { status: 500 },
    );
  }
}
