/**
 * PATCH /api/admin/floorplan/[mallId]/cameras/[cameraId]
 *
 * Phase E — floorplanRepo migration. Ownership + cross-mall CSRF check
 * (camera's own mallId must match the URL mallId) now live in
 * floorplanRepo.updateCameraForMall via assertCameraOwnedByMall.
 */

import { z } from 'zod';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import * as floorplanRepo from '@/server/repositories/floorplan';

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
    const body = await req.json();
    const data = pick(body, PATCHABLE);

    if (Object.keys(data).length === 0) {
      throw new HttpError(400, 'No valid fields to update');
    }

    return await floorplanRepo.updateCameraForMall(
      session,
      params.mallId,
      params.cameraId,
      data,
    );
  },
);
