import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/server/db/client';
import bcrypt from 'bcrypt';
import { requireAdmin } from '@/lib/admin-auth';
import { HttpError } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';

/**
 * POST /api/edge/register — Edge device registration.
 * Requires ADMIN session. Called from admin dashboard when provisioning edge units.
 * Body: { edgeId, mallId, apiKey, version?, gpuInfo?, cameras[] }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  try {
    const { edgeId, mallId, apiKey, version, gpuInfo, cameras } = await req.json();

    if (!edgeId || !mallId || !apiKey) {
      return NextResponse.json(
        { error: 'edgeId, mallId, and apiKey are required' },
        { status: 400 },
      );
    }

    // Verify mall exists AND belongs to the calling admin's customer.
    // Prevents an admin for customer A from registering an edge device
    // against customer B's mall.
    try {
      await mallRepo.assertOwnership(guard.session, mallId);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    const device = await prisma.edgeDevice.upsert({
      where: { edgeId },
      update: {
        mallId,
        apiKeyHash,
        version: version ?? undefined,
        gpuInfo: gpuInfo ?? undefined,
        lastHeartbeat: new Date(),
        status: 'ONLINE',
      },
      create: {
        edgeId,
        mallId,
        apiKeyHash,
        version: version ?? null,
        gpuInfo: gpuInfo ?? null,
        lastHeartbeat: new Date(),
        status: 'ONLINE',
      },
    });

    // Update camera stream status if provided
    if (Array.isArray(cameras)) {
      for (const cam of cameras) {
        if (cam.cameraId && cam.streamUrl) {
          await prisma.camera.updateMany({
            where: { id: cam.cameraId, mallId },
            data: { streamUrl: cam.streamUrl },
          });
        }
      }
    }

    return NextResponse.json({
      registered: true,
      deviceId: device.id,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Edge register error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 },
    );
  }
}
