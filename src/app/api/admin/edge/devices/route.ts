import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { activeCustomerMallIds } from '@/lib/admin-customer';

/**
 * GET /api/admin/edge/devices — List edge devices for the active customer.
 */
export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallIds = await activeCustomerMallIds();
  if (!mallIds) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  try {
    const devices = await prisma.edgeDevice.findMany({
      where: { mallId: { in: mallIds } },
      orderBy: { createdAt: 'desc' },
    });

    // Mark devices with stale heartbeat (>3 minutes) as OFFLINE
    const now = Date.now();
    const enriched = devices.map((d) => {
      const heartbeatAge = d.lastHeartbeat
        ? now - new Date(d.lastHeartbeat).getTime()
        : Infinity;
      const effectiveStatus = heartbeatAge > 3 * 60 * 1000 && d.status === 'ONLINE'
        ? 'OFFLINE'
        : d.status;

      return {
        id: d.id,
        edgeId: d.edgeId,
        mallId: d.mallId,
        version: d.version,
        gpuInfo: d.gpuInfo,
        lastHeartbeat: d.lastHeartbeat?.toISOString() ?? null,
        status: effectiveStatus,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Admin edge devices error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch devices' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/edge/devices — Update edge device status (e.g. force OFFLINE).
 * Body: { id, status }
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallIds = await activeCustomerMallIds();
  if (!mallIds) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !['ONLINE', 'OFFLINE', 'ERROR'].includes(status)) {
      return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
    }

    const existing = await prisma.edgeDevice.findUnique({
      where: { id },
      select: { mallId: true },
    });
    if (!existing || !mallIds.includes(existing.mallId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const device = await prisma.edgeDevice.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ id: device.id, status: device.status });
  } catch (error) {
    console.error('Admin edge update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update device' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/edge/devices — Revoke/remove an edge device.
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallIds = await activeCustomerMallIds();
  if (!mallIds) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.edgeDevice.findUnique({
      where: { id },
      select: { mallId: true },
    });
    if (!existing || !mallIds.includes(existing.mallId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.edgeDevice.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Admin edge delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete device' },
      { status: 500 },
    );
  }
}
