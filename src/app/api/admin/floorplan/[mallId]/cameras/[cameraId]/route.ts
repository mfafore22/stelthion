/**
 * PATCH /api/admin/floorplan/[mallId]/cameras/[cameraId]
 *
 * Phase D — admin group migration. Pre-Phase-D this route was admin-gated
 * and validated that the URL's mallId matched the camera's mallId, but
 * did NOT validate that the URL's mallId belonged to the calling admin's
 * customer. A tenant admin could PATCH another customer's camera
 * (modify its stream URL, zone binding, FOV, etc.) by mallId+cameraId
 * guess. Now gated by requireMallOwnership.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';

const paramsSchema = z.object({
  mallId: z.string(),
  cameraId: z.string(),
});

const PATCHABLE = [
  'label', 'angleDeg', 'fovDeg', 'rangeM', 'streamUrl',
  'active', 'model', 'resolution', 'lensInfo',
  'cameraRole', 'zoneDbId', 'homographyMatrix',
] as const;

function pick(obj: Record<string, unknown>, keys: readonly string[]) {
  return Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
}

export const PATCH = defineHandler(
  { auth: 'admin', paramsSchema },
  async ({ req, params, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const existing = await prisma.camera.findUnique({
      where: { id: params.cameraId },
    });
    if (!existing || existing.mallId !== params.mallId) {
      throw new HttpError(404, 'Camera not found');
    }

    const body = await req.json();
    const data = pick(body, PATCHABLE);

    if (Object.keys(data).length === 0) {
      throw new HttpError(400, 'No valid fields to update');
    }

    return await prisma.camera.update({
      where: { id: params.cameraId },
      data,
    });
  },
);
