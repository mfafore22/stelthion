import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/behavior — Receive store behavior data from edge.
 * Body: { jobId, behaviors: [{ zoneId, hour, walkBy, stop, enter }] }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId, behaviors } = await req.json();

    if (!jobId || !Array.isArray(behaviors)) {
      return NextResponse.json(
        { error: 'jobId and behaviors array are required' },
        { status: 400 },
      );
    }

    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, mallId: auth.mallId },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let upserted = 0;
    for (const b of behaviors) {
      if (!b.zoneId || b.hour == null) continue;

      await prisma.storeBehavior.upsert({
        where: {
          jobId_zoneId_hour: { jobId, zoneId: b.zoneId, hour: b.hour },
        },
        update: {
          walkBy: b.walkBy ?? 0,
          stop: b.stop ?? 0,
          enter: b.enter ?? 0,
        },
        create: {
          jobId,
          zoneId: b.zoneId,
          hour: b.hour,
          walkBy: b.walkBy ?? 0,
          stop: b.stop ?? 0,
          enter: b.enter ?? 0,
        },
      });
      upserted++;
    }

    return NextResponse.json({ ok: true, upserted });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge behavior error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Behavior ingestion failed' },
      { status: 500 },
    );
  }
}
