/**
 * /api/analysis/insights/[jobId]
 *
 * GET: fetch stored insights for a job (returns empty if none).
 * POST: trigger server-side LLM insight generation via local Ollama.
 *
 * Phase D — analysis group migration. Pre-Phase-D both verbs were
 * session-gated but did NOT validate job ownership. Cross-tenant insight
 * reads (and worse, cross-tenant insight *generation* costing the wrong
 * customer's mall data + LLM time) were possible by jobId-guess. Both
 * verbs now gated by requireJobOwnership.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireJobOwnership } from '@/server/api/tenant-guards';

const paramsSchema = z.object({ jobId: z.string() });

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ params, auth: session }) => {
    await requireJobOwnership(session, params.jobId);

    const insights = await prisma.analysisInsight.findMany({
      where: { jobId: params.jobId },
      orderBy: { createdAt: 'desc' },
    });

    return { insights };
  },
);

// ─── POST ───────────────────────────────────────────────────────────

export const POST = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ params, auth: session }) => {
    await requireJobOwnership(session, params.jobId);

    const job = await prisma.analysisJob.findUnique({
      where: { id: params.jobId },
      include: {
        results: { orderBy: { hour: 'asc' } },
        journeys: { include: { paths: true } },
        behaviors: { orderBy: { hour: 'asc' } },
      },
    });

    if (!job) throw new HttpError(404, 'Job not found');
    if (job.status !== 'COMPLETE') {
      throw new HttpError(400, 'Job not yet complete');
    }

    const prompt = buildInsightPrompt(job);

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

      if (!ollamaRes.ok) throw new Error(`Ollama returned ${ollamaRes.status}`);

      const ollamaData = await ollamaRes.json();
      const response = ollamaData.response ?? '';

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

    const insight = await prisma.analysisInsight.create({
      data: {
        jobId: params.jobId,
        source: 'server',
        summary,
        recommendations: recommendations.length > 0 ? JSON.stringify(recommendations) : null,
        alertLevel: 'info',
      },
    });

    return { ok: true, insight };
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInsightPrompt(job: any): string {
  const lines: string[] = [
    `You are a mall analytics expert for Ideapark Lempäälä shopping center.`,
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
    for (const sess of job.journeys) {
      lines.push('', `Journey session: ${sess.taggedCount} tagged, ${sess.recognizedCount} recognized (${((sess.recognizedCount / sess.taggedCount) * 100).toFixed(1)}% match rate)`);
      if (sess.paths?.length > 0) {
        lines.push(`  ${sess.paths.length} individual paths recorded`);
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
