import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import {auth} from '@/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  try {

    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let { mallId } = await params;
    const url = new URL(req.url);
    const weekParam = url.searchParams.get('week');
    const yearParam = url.searchParams.get('year');

    // Resolve mallId: if no mall found by mallId, try as customerId fallback
    // (mirrors /api/mall/[mallId] which also accepts customerId)
    const mallExists = await prisma.mall.findUnique({ where: { mallId }, select: { mallId: true } });
    if (!mallExists) {
      const byCustomer = await prisma.mall.findFirst({
        where: { customerId: mallId },
        select: { mallId: true },
      });
      if (byCustomer) mallId = byCustomer.mallId;
    }

    const availableWeeks = await prisma.counterReading.groupBy({
      by: ['year', 'weekNumber'],
      where: { mallId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    const weekList = availableWeeks.map((w) => ({ week: w.weekNumber, year: w.year }));

    // If no week specified, use most recent
    const targetWeek = weekParam ? parseInt(weekParam, 10) : weekList[0]?.week ?? 0;
    const targetYear = yearParam ? parseInt(yearParam, 10) : weekList[0]?.year ?? new Date().getFullYear();

    if (targetWeek === 0) {
      return NextResponse.json({ week: 0, year: targetYear, counters: [], availableWeeks: weekList });
    }

    const readings = await prisma.counterReading.findMany({
      where: { mallId, weekNumber: targetWeek, year: targetYear },
      orderBy: [{ counterLabel: 'asc' }, { date: 'asc' }, { hour: 'asc' }],
    });

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
        // Group hourly rows by date
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
          deltaPercent: weekTotalPrev ? round(((weekTotal - weekTotalPrev) / weekTotalPrev) * 100) : null,
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
          deltaPercent: weekTotalPrev ? round(((weekTotal - weekTotalPrev) / weekTotalPrev) * 100) : null,
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

    return NextResponse.json({
      week: targetWeek,
      year: targetYear,
      counters,
      availableWeeks: weekList,
    });
  } catch (err) {
    console.error('[counter data]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
