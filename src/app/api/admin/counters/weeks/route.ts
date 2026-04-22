/**
 * /api/admin/counters/weeks
 *
 * GET: list per-week counter uploads (and legacy untracked rollups) for a mall.
 * DELETE: remove a specific upload by id, or a legacy week+year bucket.
 *
 * Phase D — admin group migration. Pre-Phase-D leaks:
 *   - GET defaulted mallId to the literal string 'ideapark' when the
 *     query param was missing — a tenant admin could see Ideapark's
 *     uploads without supplying mallId, and could pass any other
 *     tenant's mallId to read their data. No ownership check.
 *   - DELETE accepted client-supplied uploadId with NO ownership check
 *     and no mallId binding — a tenant admin could delete any other
 *     tenant's counter readings (destructive, irreversible).
 *
 * After Phase D:
 *   - mallId is REQUIRED on both verbs (no fallback default).
 *   - Both verbs require mall ownership before any DB read or write.
 *   - DELETE-by-uploadId additionally re-validates that the upload's
 *     mallId matches the URL mallId (which is now known to be owned).
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ req, auth: session }) => {
    const mallId = new URL(req.url).searchParams.get('mallId');
    if (!mallId) throw new HttpError(400, 'mallId is required');

    await requireMallOwnership(session, mallId);

    // Return individual uploads so each document is visible.
    const uploads = await prisma.counterUpload.findMany({
      where: { mallId },
      orderBy: { uploadedAt: 'desc' },
    });

    // Also return legacy week-grouped data for uploads that predate tracking.
    const legacyWeeks = await prisma.counterReading.groupBy({
      by: ['year', 'weekNumber', 'granularity'],
      where: { mallId, uploadId: null },
      _sum: { visitors: true },
      _count: { counterLabel: true },
      _max: { uploadedAt: true },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    // Deduplicate legacy by year+week, preferring finer granularity.
    const seen = new Map<string, (typeof legacyWeeks)[0]>();
    const granOrder: Record<string, number> = { hourly: 3, daily: 2, weekly: 1 };
    for (const w of legacyWeeks) {
      const key = `${w.year}-${w.weekNumber}`;
      const existing = seen.get(key);
      if (!existing || (granOrder[w.granularity] ?? 0) > (granOrder[existing.granularity] ?? 0)) {
        seen.set(key, w);
      }
    }

    return [
      ...uploads.map((u) => ({
        id: u.id,
        year: u.year,
        week: u.weekNumber,
        granularity: u.granularity,
        totalVisitors: null as number | null,
        counterCount: u.counters,
        readingCount: u.readings,
        uploadedAt: u.uploadedAt,
        fileName: u.fileName,
        type: 'upload' as const,
      })),
      ...[...seen.values()].map((w) => ({
        id: null as string | null,
        year: w.year,
        week: w.weekNumber,
        granularity: w.granularity,
        totalVisitors: w._sum.visitors ?? 0,
        counterCount: w._count.counterLabel,
        readingCount: null as number | null,
        uploadedAt: w._max.uploadedAt,
        fileName: null as string | null,
        type: 'legacy' as const,
      })),
    ];
  },
);

// ─── DELETE ─────────────────────────────────────────────────────────

const deleteQuerySchema = z.object({
  mallId: z.string().min(1),
  uploadId: z.string().optional(),
  week: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
});

export const DELETE = defineHandler(
  { auth: 'admin' },
  async ({ req, auth: session }) => {
    const url = new URL(req.url);
    const parsed = deleteQuerySchema.safeParse({
      mallId: url.searchParams.get('mallId'),
      uploadId: url.searchParams.get('uploadId') ?? undefined,
      week: url.searchParams.get('week') ?? undefined,
      year: url.searchParams.get('year') ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, 'mallId is required');
    }
    const { mallId, uploadId, week, year } = parsed.data;

    await requireMallOwnership(session, mallId);

    if (uploadId) {
      // Re-validate that the upload belongs to the requested (and owned) mall.
      // This blocks a CSRF-shaped attack where the attacker knows an
      // uploadId for cust-B and tries to wrap it in their own mallId.
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
      return { ok: true, deleted: deleted.count, uploadId };
    }

    if (!week || !year) {
      throw new HttpError(400, 'Missing week/year or uploadId');
    }

    // Legacy delete by week+year (untracked uploads only) — scoped to mallId.
    const deleted = await prisma.counterReading.deleteMany({
      where: { mallId, weekNumber: week, year, uploadId: null },
    });

    return { ok: true, deleted: deleted.count, week, year };
  },
);
