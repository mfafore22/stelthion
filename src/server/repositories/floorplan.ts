/**
 * floorplanRepo — data access for FloorplanZone, Camera, and
 * FloorplanSnapshot with tenant scoping baked in.
 *
 * All three models scope via `mallId → mall.customerId`. The repo
 * delegates mall ownership to mallRepo, same as counterRepo and
 * conciergeRepo do.
 *
 * What lives here (Phase E, slice 6)
 * ----------------------------------
 * - Count helpers for the admin dashboard tile — replace the inline
 *   `{ mall: { customerId } }` filter that was sitting in
 *   src/app/admin/dashboard/page.tsx.
 * - Assert helpers for Camera (by PK) — to be used as admin routes
 *   migrate off inline ownership checks.
 * - Unscoped read helpers for the existing /api/floorplan/[mallId] and
 *   /api/floorplan/[mallId]/zones routes. Those routes expose
 *   published-only zones and active-only cameras, and have not
 *   historically enforced customer ownership (they're read by the
 *   FootfallAnalysis UI which renders any mall the caller's app flow
 *   takes them to). Preserve that behavior, but route the queries
 *   through a named Unscoped helper so the shape is visible.
 */

import type { Session } from 'next-auth';
import type {
  Camera,
  FloorplanSnapshot,
  FloorplanZone,
  Prisma,
} from '@prisma/client';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';

function requireCallerCustomerId(session: Session): string {
  const id = session.user?.customerId;
  if (!id) throw new HttpError(401, 'Unauthorized');
  return id;
}

// ─── Admin dashboard tile ────────────────────────────────────────────

/**
 * Count FloorplanZone rows visible to the calling session (via
 * zone.mall.customerId). Used by the admin dashboard tile.
 */
export async function countZonesForCaller(session: Session): Promise<number> {
  const callerCustomerId = requireCallerCustomerId(session);
  return prisma.floorplanZone.count({
    where: { mall: { customerId: callerCustomerId } },
  });
}

/**
 * Count Camera rows visible to the calling session (via
 * camera.mall.customerId). Used by the admin dashboard tile.
 */
export async function countCamerasForCaller(session: Session): Promise<number> {
  const callerCustomerId = requireCallerCustomerId(session);
  return prisma.camera.count({
    where: { mall: { customerId: callerCustomerId } },
  });
}

// ─── Camera assert ───────────────────────────────────────────────────

/**
 * Assert the calling session owns the camera with the given primary-key
 * id. Returns the camera's mallId on success. Intended for the admin
 * camera PATCH/DELETE routes to migrate to in a later slice — surfaces
 * the same 401/404/403 contract as the other per-entity assertions.
 */
export async function assertCameraOwnershipByPk(
  session: Session,
  cameraId: string,
): Promise<string> {
  const callerCustomerId = requireCallerCustomerId(session);
  const camera = await prisma.camera.findUnique({
    where: { id: cameraId },
    select: { mallId: true, mall: { select: { customerId: true } } },
  });
  if (!camera) throw new HttpError(404, 'Camera not found');
  if (!camera.mall || camera.mall.customerId !== callerCustomerId) {
    throw new HttpError(403, 'Forbidden');
  }
  return camera.mallId;
}

/**
 * Assert both (a) the caller owns the camera and (b) the camera's mallId
 * matches the mallId the caller passed. Used when creating an
 * AnalysisJob (cross-mall reference defense) and by the admin camera
 * PATCH route.
 *
 * Errors:
 *   - 401 if the session has no customerId
 *   - 403 if the camera belongs to a different customer
 *   - 404 if the camera does not exist, OR if it exists but belongs to a
 *     different mallId (even when the caller owns both malls). The two
 *     cases are fused intentionally: the 404 surface does not reveal
 *     whether an unknown cameraId exists under another mall.
 */
export async function assertCameraOwnedByMall(
  session: Session,
  mallId: string,
  cameraId: string,
): Promise<void> {
  const callerCustomerId = requireCallerCustomerId(session);
  const camera = await prisma.camera.findUnique({
    where: { id: cameraId },
    select: { mallId: true, mall: { select: { customerId: true } } },
  });
  if (!camera) throw new HttpError(404, 'Camera not found');
  if (!camera.mall || camera.mall.customerId !== callerCustomerId) {
    throw new HttpError(403, 'Forbidden');
  }
  if (camera.mallId !== mallId) throw new HttpError(404, 'Camera not found');
}

// ─── Unscoped published/active reads ─────────────────────────────────

/**
 * Return published zones for a (mallId, floor) pair, without a
 * session-scoped ownership check. The existing public-ish
 * /api/floorplan/[mallId] and /api/floorplan/[mallId]/zones routes use
 * this; they have not historically performed customer ownership on the
 * basis that the data served (only zones with `publishedAt != null`)
 * is effectively public within the product flow.
 *
 * If `floor` is omitted, zones for ALL floors are returned.
 */
export async function listPublishedZonesForMallUnscoped(
  mallId: string,
  floor?: string,
): Promise<FloorplanZone[]> {
  return prisma.floorplanZone.findMany({
    where: {
      mallId,
      publishedAt: { not: null },
      ...(floor ? { floor } : {}),
    },
    orderBy: { zoneId: 'asc' },
  });
}

/**
 * Return active cameras for a (mallId, floor) pair, without a
 * session-scoped ownership check. Same rationale as
 * listPublishedZonesForMallUnscoped.
 */
export async function listActiveCamerasForMallUnscoped(
  mallId: string,
  floor?: string,
): Promise<Camera[]> {
  return prisma.camera.findMany({
    where: {
      mallId,
      active: true,
      ...(floor ? { floor } : {}),
    },
    orderBy: { label: 'asc' },
  });
}

// ─── Admin scoped list helpers (for future migrations) ───────────────

/**
 * List all zones for a mall the caller owns, regardless of publish
 * state. Intended for admin-area routes (zone editor, publish).
 */
export async function listZonesForMall(
  session: Session,
  mallId: string,
  floor?: string,
): Promise<FloorplanZone[]> {
  await mallRepo.assertOwnership(session, mallId);
  return prisma.floorplanZone.findMany({
    where: { mallId, ...(floor ? { floor } : {}) },
    orderBy: { zoneId: 'asc' },
  });
}

/**
 * List all cameras for a mall the caller owns.
 */
export async function listCamerasForMall(
  session: Session,
  mallId: string,
  floor?: string,
): Promise<Camera[]> {
  await mallRepo.assertOwnership(session, mallId);
  return prisma.camera.findMany({
    where: { mallId, ...(floor ? { floor } : {}) },
    orderBy: { label: 'asc' },
  });
}

/**
 * Update a camera after asserting both caller ownership and that the
 * camera belongs to the passed mallId. Used by admin camera PATCH.
 */
export async function updateCameraForMall(
  session: Session,
  mallId: string,
  cameraId: string,
  data: Prisma.CameraUpdateInput,
): Promise<Camera> {
  await assertCameraOwnedByMall(session, mallId, cameraId);
  return prisma.camera.update({ where: { id: cameraId }, data });
}

/**
 * Mark every zone on a mall+floor as published. Returns the timestamp
 * used so callers can echo it back. Used by admin publish POST.
 */
export async function publishZonesForMall(
  session: Session,
  mallId: string,
  floor: string,
): Promise<{ publishedAt: Date }> {
  await mallRepo.assertOwnership(session, mallId);
  const publishedAt = new Date();
  await prisma.floorplanZone.updateMany({
    where: { mallId, floor },
    data: { publishedAt },
  });
  return { publishedAt };
}

/**
 * List snapshots for a mall+floor, newest first. The returned rows are
 * trimmed to the id/reason/createdAt shape used by the admin UI — the
 * full `data` blob is intentionally excluded to keep list responses
 * small.
 */
export async function listSnapshotsForMall(
  session: Session,
  mallId: string,
  floor: string,
  take = 20,
): Promise<Array<Pick<FloorplanSnapshot, 'id' | 'reason' | 'createdAt'>>> {
  await mallRepo.assertOwnership(session, mallId);
  return prisma.floorplanSnapshot.findMany({
    where: { mallId, floor },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, reason: true, createdAt: true },
  });
}

/**
 * Fetch a snapshot by pk after asserting both caller ownership of the
 * passed mallId AND that the snapshot's own mallId matches. Carries the
 * CSRF-shape defense for the restore flow: even if a caller owns multiple
 * malls, the URL mallId and the snapshot's mallId must agree.
 *
 * Throws HttpError(404) if the snapshot is missing or belongs to a
 * different mallId — the two cases are fused intentionally so the error
 * does not reveal whether an unknown snapshotId exists in another tenant.
 */
export async function findSnapshotForMall(
  session: Session,
  mallId: string,
  snapshotId: string,
): Promise<FloorplanSnapshot> {
  await mallRepo.assertOwnership(session, mallId);
  const snapshot = await prisma.floorplanSnapshot.findUnique({
    where: { id: snapshotId },
  });
  if (!snapshot || snapshot.mallId !== mallId) {
    throw new HttpError(404, 'Snapshot not found');
  }
  return snapshot;
}
