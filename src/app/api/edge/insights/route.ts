import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/insights — Receive LLM-generated insights from edge unit.
 * Body: { jobId, summary, recommendations?, alertLevel? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId, summary, recommendations, alertLevel } = await req.json();

    if (!jobId || !summary) {
      return NextResponse.json(
        { error: 'jobId and summary are required' },
        { status: 400 },
      );
    }

    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, mallId: auth.mallId },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const insight = await prisma.analysisInsight.create({
      data: {
        jobId,
        source: 'edge',
        summary,
        recommendations: recommendations
          ? (typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations))
          : null,
        alertLevel: alertLevel ?? 'info',
      },
    });

    return NextResponse.json({ ok: true, insightId: insight.id });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Insight ingestion failed' },
      { status: 500 },
    );
  }
}
