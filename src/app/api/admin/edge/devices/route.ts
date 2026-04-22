/**
 * /api/admin/edge/devices
 *
 * Phase E — edgeDeviceRepo migration. Ownership checks now live in
 * src/server/repositories/edge-device.ts; the route body is pure
 * request/response shaping. Tenant scoping is unchanged semantically:
 *   - GET filters devices whose mall belongs to the calling admin's customer.
 *   - PATCH validates device ownership before update.
 *   - DELETE validates device ownership before delete.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';
import * as edgeDeviceRepo from '@/server/repositories/edge-device';

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => {
    const devices = await edgeDeviceRepo.listForCaller(session);

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
    await edgeDeviceRepo.assertOwnership(session, body.id);

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
    await edgeDeviceRepo.assertOwnership(session, body.id);

    await prisma.edgeDevice.delete({ where: { id: body.id } });
    return { deleted: true };
  },
);
