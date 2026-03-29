import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/heartbeat — Edge health ping (every 60s).
 * Body: { edgeId, cameras?: [{ cameraId, status, fps }], activeJobId?, cpuPercent?, gpuPercent?, gpuMemMb? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const body = await req.json();

    await prisma.edgeDevice.update({
      where: { edgeId: auth.edgeId },
      data: {
        lastHeartbeat: new Date(),
        status: 'ONLINE',
        version: body.version ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, serverTime: new Date().toISOString() });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge heartbeat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Heartbeat failed' },
      { status: 500 },
    );
  }
}
