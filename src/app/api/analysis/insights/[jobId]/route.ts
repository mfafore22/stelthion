import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { currentUserMallIds } from '@/lib/admin-customer';

async function assertJobInScope(jobId: string): Promise<NextResponse | { mallId: string }> {
  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    select: { mallId: true },
  });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  const allowed = await currentUserMallIds();
  if (!allowed || !allowed.includes(job.mallId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { mallId: job.mallId };
}

/**
 * GET /api/analysis/insights/[jobId] — Fetch insights for a job.
 * Returns edge-generated insights if available, otherwise empty.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params;
  const scope = await assertJobInScope(jobId);
  if (scope instanceof NextResponse) return scope;

  try {
    const insights = await prisma.analysisInsight.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Fetch insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch insights' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analysis/insights/[jobId] — Trigger server-side LLM insight generation.
 * Fallback when edge insights are unavailable or need refinement.
 * Calls local Ollama endpoint to generate insights from job results.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params;
  const scope = await assertJobInScope(jobId);
  if (scope instanceof NextResponse) return scope;

  try {
    // Fetch job with all results
    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: {
        mall: { select: { name: true, city: true } },
        results: { orderBy: { hour: 'asc' } },
        journeys: { include: { paths: true } },
        behaviors: { orderBy: { hour: 'asc' } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'COMPLETE') {
      return NextResponse.json({ error: 'Job not yet complete' }, { status: 400 });
    }

    // Build structured prompt for LLM
    const prompt = buildInsightPrompt(job);

    // Call local Ollama endpoint
    const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';

    let summary: string;
    let recommendations: string[] = [];

    try {
      const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false,
          options: { temperature: 0.3, num_predict: 1024 },
        }),
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama returned ${ollamaRes.status}`);
      }

      const ollamaData = await ollamaRes.json();
      const response = ollamaData.response ?? '';

      // Parse LLM response — expect summary followed by recommendations
      const parts = response.split(/\n(?=Recommendations?:)/i);
      summary = parts[0]?.trim() || 'Analysis complete. No detailed insights generated.';

      if (parts[1]) {
        recommendations = parts[1]
          .replace(/^Recommendations?:\s*/i, '')
          .split(/\n[-•]\s*/)
          .map((r: string) => r.trim())
          .filter(Boolean);
      }
    } catch {
      // Ollama not available — return a basic numerical summary
      summary = generateFallbackSummary(job);
    }

    // Store insight
    const insight = await prisma.analysisInsight.create({
      data: {
        jobId,
        source: 'server',
        summary,
        recommendations: recommendations.length > 0 ? JSON.stringify(recommendations) : null,
        alertLevel: 'info',
      },
    });

    return NextResponse.json({ ok: true, insight });
  } catch (error) {
    console.error('Generate insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Insight generation failed' },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInsightPrompt(job: any): string {
  const mallLabel = job.mall?.name
    ? `${job.mall.name}${job.mall.city ? ` (${job.mall.city})` : ''}`
    : 'this shopping center';
  const lines: string[] = [
    `You are a mall analytics expert for ${mallLabel}.`,
    `Analyze the following data and provide:`,
    `1. A brief summary of key findings (2-3 sentences)`,
    `2. Actionable recommendations for the mall administrator`,
    ``,
    `Analysis mode: ${job.mode}`,
    `Date: ${job.footageDate}`,
    `Time: ${job.startTime} - ${job.endTime}`,
  ];

  if (job.results?.length > 0) {
    lines.push('', 'Hourly visitor counts by zone:');
    for (const r of job.results) {
      lines.push(`  Zone ${r.zoneId} at ${r.hour}:00 — ${r.count} visitors (density: ${r.density})`);
    }
  }

  if (job.journeys?.length > 0) {
    for (const session of job.journeys) {
      lines.push('', `Journey session: ${session.taggedCount} tagged, ${session.recognizedCount} recognized (${((session.recognizedCount / session.taggedCount) * 100).toFixed(1)}% match rate)`);
      if (session.paths?.length > 0) {
        lines.push(`  ${session.paths.length} individual paths recorded`);
      }
    }
  }

  if (job.behaviors?.length > 0) {
    lines.push('', 'Store behavior data:');
    for (const b of job.behaviors) {
      const total = b.walkBy + b.stop + b.enter;
      const stopRate = total > 0 ? ((b.stop / total) * 100).toFixed(1) : '0';
      const enterRate = total > 0 ? ((b.enter / total) * 100).toFixed(1) : '0';
      lines.push(`  ${b.zoneId} at ${b.hour}:00 — ${b.walkBy} walk-by, ${b.stop} stop (${stopRate}%), ${b.enter} enter (${enterRate}%)`);
    }
  }

  return lines.join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackSummary(job: any): string {
  const totalVisitors = job.results?.reduce((sum: number, r: { count: number }) => sum + r.count, 0) ?? 0;
  const totalPaths = job.journeys?.reduce((sum: number, s: { paths?: unknown[] }) => sum + (s.paths?.length ?? 0), 0) ?? 0;

  const parts: string[] = [];
  if (totalVisitors > 0) parts.push(`${totalVisitors.toLocaleString()} total visitor detections across all zones`);
  if (totalPaths > 0) parts.push(`${totalPaths} journey paths tracked`);

  if (job.behaviors?.length > 0) {
    const totalEnter = job.behaviors.reduce((s: number, b: { enter: number }) => s + b.enter, 0);
    const totalWalkBy = job.behaviors.reduce((s: number, b: { walkBy: number }) => s + b.walkBy, 0);
    if (totalWalkBy > 0) {
      parts.push(`${((totalEnter / (totalWalkBy + totalEnter)) * 100).toFixed(1)}% average store entry rate`);
    }
  }

  return parts.length > 0 ? parts.join('. ') + '.' : 'Analysis complete.';
}
