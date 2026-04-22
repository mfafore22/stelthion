/**
 * /api/admin/counters/weeks
 *
 * GET: list per-week counter uploads (and legacy untracked rollups) for a mall.
 * DELETE: remove a specific upload by id, or a legacy week+year bucket.
 *
 * Phase E — counterRepo migration. Ownership + CSRF-shape defense now
 * live in src/server/repositories/counter.ts. The route body is pure
 * request/response shaping.
 */

import { z } from 'zod';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import * as counterRepo from '@/server/repositories/counter';

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ req, auth: session }) => {
    const mallId = new URL(req.url).searchParams.get('mallId');
    if (!mallId) throw new HttpError(400, 'mallId is required');

    const { uploads, legacyWeeks } = await counterRepo.listWeeksPageDataForMall(
      session,
      mallId,
    );

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

    if (uploadId) {
      const { deletedReadings } = await counterRepo.deleteUploadByIdForMall(
        session,
        mallId,
        uploadId,
      );
      return { ok: true, deleted: deletedReadings, uploadId };
    }

    if (!week || !year) {
      throw new HttpError(400, 'Missing week/year or uploadId');
    }

    const { deletedReadings } = await counterRepo.deleteLegacyWeekForMall(
      session,
      mallId,
      week,
      year,
    );
    return { ok: true, deleted: deletedReadings, week, year };
  },
);
