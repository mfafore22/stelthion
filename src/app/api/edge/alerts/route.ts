import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/alerts — Receive real-time anomaly alerts from edge LLM.
 * Body: { jobId?, summary, alertLevel: "warning"|"critical", recommendations? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId, summary, alertLevel, recommendations } = await req.json();

    if (!summary || !alertLevel) {
      return NextResponse.json(
        { error: 'summary and alertLevel are required' },
        { status: 400 },
      );
    }

    if (!['warning', 'critical'].includes(alertLevel)) {
      return NextResponse.json(
        { error: 'alertLevel must be "warning" or "critical"' },
        { status: 400 },
      );
    }

    // If there's a jobId, associate with the job; otherwise create a standalone alert
    // For standalone alerts, find the most recent active job for the mall
    let resolvedJobId = jobId;
    if (!resolvedJobId) {
      const activeJob = await prisma.analysisJob.findFirst({
        where: { mallId: auth.mallId, status: 'PROCESSING' },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      resolvedJobId = activeJob?.id;
    }

    if (!resolvedJobId) {
      return NextResponse.json(
        { error: 'No active job found and no jobId provided' },
        { status: 400 },
      );
    }

    const alert = await prisma.analysisInsight.create({
      data: {
        jobId: resolvedJobId,
        source: 'edge',
        summary,
        alertLevel,
        recommendations: recommendations
          ? (typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations))
          : null,
      },
    });

    return NextResponse.json({ ok: true, alertId: alert.id });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge alerts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Alert ingestion failed' },
      { status: 500 },
    );
  }
}
