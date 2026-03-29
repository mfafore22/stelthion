import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/journeys — Receive AB_TRACKING / JOURNEY_MAP results.
 * Body: {
 *   jobId,
 *   session: {
 *     taggedCount, recognizedCount,
 *     paths: [{ zoneSequence: string, timestamps: string }]
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { jobId, session } = await req.json();

    if (!jobId || !session) {
      return NextResponse.json(
        { error: 'jobId and session are required' },
        { status: 400 },
      );
    }

    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, mallId: auth.mallId },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Create journey session and paths in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const journeySession = await tx.journeySession.create({
        data: {
          jobId,
          taggedCount: session.taggedCount ?? 0,
          recognizedCount: session.recognizedCount ?? 0,
        },
      });

      let pathCount = 0;
      if (Array.isArray(session.paths)) {
        for (const p of session.paths) {
          await tx.journeyPath.create({
            data: {
              sessionId: journeySession.id,
              zoneSequence: typeof p.zoneSequence === 'string' ? p.zoneSequence : JSON.stringify(p.zoneSequence),
              timestamps: typeof p.timestamps === 'string' ? p.timestamps : JSON.stringify(p.timestamps),
            },
          });
          pathCount++;
        }
      }

      return { sessionId: journeySession.id, pathCount };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge journeys error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Journey ingestion failed' },
      { status: 500 },
    );
  }
}
