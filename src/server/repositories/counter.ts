/**
 * counterRepo — data access for CounterReading + CounterUpload.
 *
 * Both models are mall-scoped via a `mallId` column. Each method in
 * this module takes the caller's Session and the mallId the caller
 * wants to operate on, then internally delegates mall ownership to
 * mallRepo.assertOwnership before touching CounterReading or
 * CounterUpload rows. The extra DB roundtrip for the ownership check
 * is cheap and removes the class of leak where a route forgets to
 * guard a destructive op.
 *
 * The destructive helpers additionally carry the CSRF-shape defense
 * that used to live inline in /api/admin/counters/weeks DELETE:
 * when a caller passes both an uploadId and a mallId, the upload's
 * own mallId must match. Without that re-check, an attacker who
 * knows another tenant's uploadId could wrap it in their own owned
 * mallId and delete someone else's data.
 */

import type { Session } from 'next-auth';
import type { CounterUpload, Prisma } from '@prisma/client';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';

/**
 * List CounterUpload rows for a mall the caller owns, newest first.
 */
export async function listUploadsForMall(
  session: Session,
  mallId: string,
): Promise<CounterUpload[]> {
  await mallRepo.assertOwnership(session, mallId);
  return prisma.counterUpload.findMany({
    where: { mallId },
    orderBy: { uploadedAt: 'desc' },
  });
}

type LegacyWeekSummary = {
  year: number;
  weekNumber: number;
  granularity: string;
  _sum: { visitors: number | null };
  _count: { counterLabel: number };
  _max: { uploadedAt: Date | null };
};

/**
 * Group CounterReading rows with `uploadId IS NULL` — the untracked
 * legacy uploads that predate the CounterUpload tracking table — by
 * (year, weekNumber, granularity) for a mall the caller owns.
 */
export async function listLegacyWeekSummariesForMall(
  session: Session,
  mallId: string,
): Promise<LegacyWeekSummary[]> {
  await mallRepo.assertOwnership(session, mallId);
  return listLegacyWeekSummariesForMallUnscoped(mallId);
}

async function listLegacyWeekSummariesForMallUnscoped(
  mallId: string,
): Promise<LegacyWeekSummary[]> {
  const rows = await prisma.counterReading.groupBy({
    by: ['year', 'weekNumber', 'granularity'],
    where: { mallId, uploadId: null },
    _sum: { visitors: true },
    _count: { counterLabel: true },
    _max: { uploadedAt: true },
    orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
  });
  return rows as unknown as LegacyWeekSummary[];
}

/**
 * One-ownership-check combined read: uploads AND legacy week summaries
 * for a mall the caller owns. Used by /api/admin/counters/weeks GET
 * to avoid paying the ownership roundtrip twice per request.
 */
export async function listWeeksPageDataForMall(
  session: Session,
  mallId: string,
): Promise<{ uploads: CounterUpload[]; legacyWeeks: LegacyWeekSummary[] }> {
  await mallRepo.assertOwnership(session, mallId);
  const [uploads, legacyWeeks] = await Promise.all([
    prisma.counterUpload.findMany({
      where: { mallId },
      orderBy: { uploadedAt: 'desc' },
    }),
    listLegacyWeekSummariesForMallUnscoped(mallId),
  ]);
  return { uploads, legacyWeeks };
}

/**
 * Delete a specific CounterUpload and all of its CounterReading rows,
 * gated by ownership of `mallId` AND by a CSRF-shape check that the
 * upload's own `mallId` matches the one the caller passed. Returns the
 * number of reading rows removed.
 *
 * Throws HttpError(404) when the upload doesn't exist, HttpError(403)
 * when the upload belongs to a different mall than the caller
 * claimed (even if the caller owns both malls — the explicit
 * parameter has to match to prevent accidental cross-mall deletes).
 */
export async function deleteUploadByIdForMall(
  session: Session,
  mallId: string,
  uploadId: string,
): Promise<{ deletedReadings: number }> {
  await mallRepo.assertOwnership(session, mallId);

  const upload = await prisma.counterUpload.findUnique({
    where: { id: uploadId },
    select: { mallId: true },
  });
  if (!upload) throw new HttpError(404, 'Upload not found');
  if (upload.mallId !== mallId) {
    throw new HttpError(403, 'Upload does not belong to this mall');
  }

  const deleted = await prisma.counterReading.deleteMany({
    where: { uploadId },
  });
  await prisma.counterUpload.delete({ where: { id: uploadId } });
  return { deletedReadings: deleted.count };
}

/**
 * Delete the legacy (untracked) CounterReading rows for a given
 * (mall, week, year). Only matches rows with `uploadId IS NULL`, so
 * tracked uploads are never touched by this path.
 */
export async function deleteLegacyWeekForMall(
  session: Session,
  mallId: string,
  weekNumber: number,
  year: number,
): Promise<{ deletedReadings: number }> {
  await mallRepo.assertOwnership(session, mallId);

  const deleted = await prisma.counterReading.deleteMany({
    where: { mallId, weekNumber, year, uploadId: null },
  });
  return { deletedReadings: deleted.count };
}

/**
 * Group CounterReading rows by (year, weekNumber) for a given mall.
 * Used by the public counters/[mallId] route to render the "available
 * weeks" dropdown. The mallId is assumed already verified via
 * mallRepo — this is the one caller that is invoked with a mallId
 * that was resolved by `resolveMallIdOrCustomerId`, which already
 * performs the ownership check, so the repo skips an extra roundtrip.
 *
 * Callers that have not already verified mall ownership MUST use the
 * non-Unscoped variants that take a session, or assert ownership
 * themselves before calling this.
 */
export async function listAvailableWeeksForMallUnscoped(
  mallId: string,
): Promise<Array<{ year: number; weekNumber: number }>> {
  const rows = await prisma.counterReading.groupBy({
    by: ['year', 'weekNumber'],
    where: { mallId },
    orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
  });
  return rows.map((r) => ({ year: r.year, weekNumber: r.weekNumber }));
}

/**
 * Find CounterReading rows for a (mall, week, year), with optional
 * extra `where` filters folded in. Ordered by counterLabel, date,
 * hour — the order that the aggregation code downstream expects.
 */
export async function listReadingsForMallWeekUnscoped(
  mallId: string,
  weekNumber: number,
  year: number,
  extraWhere: Prisma.CounterReadingWhereInput = {},
) {
  return prisma.counterReading.findMany({
    where: { ...extraWhere, mallId, weekNumber, year },
    orderBy: [{ counterLabel: 'asc' }, { date: 'asc' }, { hour: 'asc' }],
  });
}
