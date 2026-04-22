/**
 * GET /api/counters/[mallId]/export
 *
 * CSV (or JSON) export of CounterReading rows for a given week.
 *
 * Phase E — counterRepo migration. Ownership is still enforced via
 * requireMallOwnership, then the findMany goes through the Unscoped
 * repo helper (ownership already verified).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';
import * as counterRepo from '@/server/repositories/counter';

const paramsSchema = z.object({ mallId: z.string() });

export const GET = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ req, params, auth: session }) => {
    await requireMallOwnership(session, params.mallId);

    const url = new URL(req.url);
    const week = parseInt(url.searchParams.get('week') ?? '0', 10);
    const year = parseInt(url.searchParams.get('year') ?? '0', 10);
    const counterFilter = url.searchParams.get('counter') ?? 'all';
    const format = url.searchParams.get('format') ?? 'csv';

    if (!week || !year) {
      throw new HttpError(400, 'week and year required');
    }

    const extraWhere =
      counterFilter !== 'all' ? { counterLabel: counterFilter } : {};

    const readings = await counterRepo.listReadingsForMallWeekUnscoped(
      params.mallId,
      week,
      year,
      extraWhere,
    );

    if (format === 'csv') {
      const header = 'Date,Hour,Counter,Floor,Visitors,Visitors Prev Year,Delta %\n';
      const rows = readings.map((r) => {
        const date = r.date.toISOString().split('T')[0];
        const hour = r.hour >= 0 ? r.hour : '';
        const delta =
          r.visitorsPrevYear && r.visitorsPrevYear > 0
            ? (((r.visitors - r.visitorsPrevYear) / r.visitorsPrevYear) * 100).toFixed(1)
            : '';
        const label = r.counterLabel.includes(',') ? `"${r.counterLabel}"` : r.counterLabel;
        return `${date},${hour},${label},${r.floor},${r.visitors},${r.visitorsPrevYear ?? ''},${delta}`;
      });
      const csv = header + rows.join('\n');
      const filename = `counters-${params.mallId}-wk${week}-${year}.csv`;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON fallback
    return readings;
  },
);
