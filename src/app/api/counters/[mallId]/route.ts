/**
 * GET /api/counters/[mallId]
 *
 * Phase D — counters group migration to defineHandler. Behavior preserved
 * vs the pre-refactor handler:
 *
 *   - 401 when no session
 *   - 403 when the resolved mall belongs to a different customer
 *   - 404 when neither the mallId nor a customerId fallback resolves
 *   - 200 with the per-week aggregated counters payload
 *
 * Tenant-scoping notes
 * --------------------
 * The path segment is documented as `mallId` but historically the route
 * also accepted a customerId — when a mall lookup by `mallId` failed it
 * fell back to `mall.findFirst({ where: { customerId: <param> } })`. The
 * fallback is preserved for compatibility, but ownership is now enforced
 * in BOTH branches against the calling session's customerId. A caller
 * cannot reach another tenant's data via either branch.
 */

import { z } from 'zod';
import { defineHandler } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';
import * as counterRepo from '@/server/repositories/counter';

const paramsSchema = z.object({ mallId: z.string() });

export const GET = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ req, params, auth: session }) => {
    // Resolve mallId, accepting either a real mallId or a customerId
    // (legacy compatibility). Either way the resolved mall must belong
    // to the caller's customer.
    const resolvedMallId = await mallRepo.resolveMallIdOrCustomerId(session, params.mallId);

    const url = new URL(req.url);
    const weekParam = url.searchParams.get('week');
    const yearParam = url.searchParams.get('year');

    const weekList = await counterRepo.listAvailableWeeksForMallUnscoped(resolvedMallId);

    const targetWeek = weekParam ? parseInt(weekParam, 10) : weekList[0]?.weekNumber ?? 0;
    const targetYear = yearParam
      ? parseInt(yearParam, 10)
      : weekList[0]?.year ?? new Date().getFullYear();

    const availableWeeks = weekList.map((w) => ({ week: w.weekNumber, year: w.year }));

    if (targetWeek === 0) {
      return { week: 0, year: targetYear, counters: [], availableWeeks };
    }

    const readings = await counterRepo.listReadingsForMallWeekUnscoped(
      resolvedMallId,
      targetWeek,
      targetYear,
    );

    // Group by counter
    const grouped = new Map<string, typeof readings>();
    for (const r of readings) {
      const arr = grouped.get(r.counterLabel) ?? [];
      arr.push(r);
      grouped.set(r.counterLabel, arr);
    }

    const counters = [...grouped.entries()].map(([label, rows]) => {
      const floor = rows[0].floor;
      const granularity = rows[0].granularity;

      if (granularity === 'hourly') {
        const byDate = new Map<string, typeof rows>();
        for (const r of rows) {
          const dk = r.date.toISOString().split('T')[0];
          const arr = byDate.get(dk) ?? [];
          arr.push(r);
          byDate.set(dk, arr);
        }
        const dailyData = [...byDate.entries()].map(([date, hourRows]) => ({
          date,
          visitors: hourRows.reduce((s, r) => s + r.visitors, 0),
          visitorsPrevYear: hourRows.some((r) => r.visitorsPrevYear != null)
            ? hourRows.reduce((s, r) => s + (r.visitorsPrevYear ?? 0), 0)
            : null,
          hourlyData: hourRows
            .filter((r) => r.hour >= 0)
            .map((r) => ({
              hour: r.hour,
              visitors: r.visitors,
              prevYear: r.visitorsPrevYear,
              year2: r.visitorsYear2,
              year3: r.visitorsYear3,
            })),
        }));
        const weekTotal = dailyData.reduce((s, d) => s + d.visitors, 0);
        const weekTotalPrev = dailyData.some((d) => d.visitorsPrevYear != null)
          ? dailyData.reduce((s, d) => s + (d.visitorsPrevYear ?? 0), 0)
          : null;
        return {
          label,
          floor,
          granularity,
          dailyData,
          weekTotal,
          weekTotalPrevYear: weekTotalPrev,
          deltaPercent: weekTotalPrev
            ? round(((weekTotal - weekTotalPrev) / weekTotalPrev) * 100)
            : null,
        };
      }

      if (granularity === 'daily') {
        const dailyData = rows.map((r) => ({
          date: r.date.toISOString().split('T')[0],
          visitors: r.visitors,
          visitorsPrevYear: r.visitorsPrevYear,
        }));
        const weekTotal = dailyData.reduce((s, d) => s + d.visitors, 0);
        const weekTotalPrev = dailyData.some((d) => d.visitorsPrevYear != null)
          ? dailyData.reduce((s, d) => s + (d.visitorsPrevYear ?? 0), 0)
          : null;
        return {
          label,
          floor,
          granularity,
          dailyData,
          weekTotal,
          weekTotalPrevYear: weekTotalPrev,
          deltaPercent: weekTotalPrev
            ? round(((weekTotal - weekTotalPrev) / weekTotalPrev) * 100)
            : null,
        };
      }

      // Weekly — single row, derive daily estimates
      const r = rows[0];
      const weekTotal = r.visitors;
      const dailyEst = Math.round(weekTotal / 7);
      const prevEst = r.visitorsPrevYear ? Math.round(r.visitorsPrevYear / 7) : null;
      const monday = r.date;
      const dailyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return {
          date: d.toISOString().split('T')[0],
          visitors: dailyEst,
          visitorsPrevYear: prevEst,
          estimated: true,
        };
      });
      return {
        label,
        floor,
        granularity,
        dailyData,
        weekTotal,
        weekTotalPrevYear: r.visitorsPrevYear,
        deltaPercent: r.visitorsPrevYear
          ? round(((weekTotal - r.visitorsPrevYear) / r.visitorsPrevYear) * 100)
          : null,
      };
    });

    return {
      week: targetWeek,
      year: targetYear,
      counters,
      availableWeeks,
    };
  },
);

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
