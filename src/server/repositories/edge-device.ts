/**
 * edgeDeviceRepo — data access for the EdgeDevice model with tenant
 * scoping baked in.
 *
 * Ownership path: device.mall.customerId === session.user.customerId.
 * Used by admin routes (auth: 'admin') that list, patch, or delete
 * edge devices.
 *
 * Edge-side writers (src/app/api/edge/heartbeat, validateEdgeAuth)
 * authenticate by the edge's own JWT — they prove device identity
 * from the token, not from a session cookie, and therefore don't
 * use this module. Their ownership model is enforced by the HMAC
 * on the JWT.
 */

import type { Session } from 'next-auth';
import type { EdgeDevice } from '@prisma/client';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';

function requireCallerCustomerId(session: Session): string {
  const callerCustomerId = session.user?.customerId;
  if (!callerCustomerId) {
    throw new HttpError(401, 'Unauthorized');
  }
  return callerCustomerId;
}

/**
 * Assert the calling session owns the edge device with the given
 * primary-key id. Returns the owning customerId on success.
 *
 * Throws HttpError(404) if the device doesn't exist, HttpError(403)
 * if it belongs to a different customer, HttpError(401) if the
 * session has no customerId.
 */
export async function assertOwnership(
  session: Session,
  deviceId: string,
): Promise<string> {
  const callerCustomerId = requireCallerCustomerId(session);

  const device = await prisma.edgeDevice.findUnique({
    where: { id: deviceId },
    select: { mall: { select: { customerId: true } } },
  });

  if (!device) throw new HttpError(404, 'Device not found');
  if (!device.mall || device.mall.customerId !== callerCustomerId) {
    throw new HttpError(403, 'Forbidden');
  }
  return device.mall.customerId;
}

/**
 * List edge devices visible to the calling session, scoped via
 * device.mall.customerId. Ordered by creation time descending — the
 * admin dashboard renders the most recently registered first.
 */
export async function listForCaller(session: Session): Promise<EdgeDevice[]> {
  const callerCustomerId = requireCallerCustomerId(session);

  return prisma.edgeDevice.findMany({
    where: { mall: { customerId: callerCustomerId } },
    orderBy: { createdAt: 'desc' },
  });
}
