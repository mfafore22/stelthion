/**
 * /api/admin/edge/devices
 *
 * Phase D — admin group migration. The B.5 tenant-scoping checks are
 * preserved bytewise. PATCH and DELETE now share an explicit
 * requireDeviceOwnership check inlined locally (single Prisma lookup
 * via mall.customerId).
 *
 * Tenant scoping (unchanged from B.5):
 *   - GET filters devices whose mall belongs to the calling admin's customer.
 *   - PATCH validates device ownership before update.
 *   - DELETE validates device ownership before delete.
 */

import { z } from 'zod';
import type { Session } from 'next-auth';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => {
    const devices = await prisma.edgeDevice.findMany({
      where: { mall: { customerId: session.user.customerId } },
      orderBy: { createdAt: 'desc' },
    });

    // Mark devices with stale heartbeat (>3 minutes) as OFFLINE.
    const now = Date.now();
    return devices.map((d) => {
      const heartbeatAge = d.lastHeartbeat
        ? now - new Date(d.lastHeartbeat).getTime()
        : Infinity;
      const effectiveStatus =
        heartbeatAge > 3 * 60 * 1000 && d.status === 'ONLINE'
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
  },
);

// ─── PATCH ──────────────────────────────────────────────────────────

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['ONLINE', 'OFFLINE', 'ERROR']),
});

export const PATCH = defineHandler(
  { auth: 'admin', bodySchema: patchSchema },
  async ({ body, auth: session }) => {
    await requireDeviceOwnership(session, body.id);

    const device = await prisma.edgeDevice.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    return { id: device.id, status: device.status };
  },
);

// ─── DELETE ─────────────────────────────────────────────────────────

const deleteSchema = z.object({
  id: z.string().min(1),
});

export const DELETE = defineHandler(
  { auth: 'admin', bodySchema: deleteSchema },
  async ({ body, auth: session }) => {
    await requireDeviceOwnership(session, body.id);

    await prisma.edgeDevice.delete({ where: { id: body.id } });
    return { deleted: true };
  },
);

// ─── Local tenant guard ────────────────────────────────────────────

/**
 * Asserts that the calling session's customer owns the edge device with
 * the given id. Lives here (not in tenant-guards.ts) because edge devices
 * are admin-only — no other route group references them.
 */
async function requireDeviceOwnership(
  session: Session,
  deviceId: string,
): Promise<void> {
  const callerCustomerId = session.user?.customerId;
  if (!callerCustomerId) throw new HttpError(401, 'Unauthorized');

  const device = await prisma.edgeDevice.findUnique({
    where: { id: deviceId },
    select: { mall: { select: { customerId: true } } },
  });

  if (!device) throw new HttpError(404, 'Device not found');
  if (!device.mall || device.mall.customerId !== callerCustomerId) {
    throw new HttpError(403, 'Forbidden');
  }
}
