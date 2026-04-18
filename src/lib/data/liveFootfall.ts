/**
 * Shared live footfall aggregation — single source of truth for
 * counter-based visitor numbers used by Performance KPIs, the counter
 * profile API, and concierge tools. Keeps all three in lock-step.
 */

import prisma from '@/app/lib/prisma';

// Hourly curve matching useCounterFootfall.ts — used to distribute
// daily totals into hourly estimates when only daily data exists.
const HOURLY_CURVE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0.08, 0.32, 0.58, 0.74,
  0.88, 0.96, 1.00, 0.97,
  0.41, 0.30, 0.14, 0.05,
  0, 0,
];
const CURVE_SUM = HOURLY_CURVE.reduce((a, b) => a + b, 0);

export interface HourlyProfileEntry {
  weekday: number;
  hour: number;
  avg: number;
  avgPrevYear: number | null;
}

export interface DailyProfileEntry {
  weekday: number;
  avg: number;
  avgPrevYear: number | null;
}

export interface CounterProfile {
  dataAvailable: boolean;
  peakHourlyVisitors: number;
  hourlyProfile: HourlyProfileEntry[];
  weekdayDailyAvg: DailyProfileEntry[];
}

export interface LiveFootfall {
  currentVisitors: number | null;
  prevYear: number | null;
  weekday: number;
  hour: number;
  isEstimated: boolean;
  source: 'exact' | 'profile' | 'none';
}

/**
 * Aggregate raw counter readings into weekday×hour + weekday-daily profiles.
 * Readings across multiple counters on the same (date, hour) are SUMMED
 * before being averaged across dates — this matches how Performance
 * renders totals (mall-wide, not per-counter).
 */
export async function getCounterProfile(mallId: string): Promise<CounterProfile> {
  const readings = await prisma.counterReading.findMany({
    where: { mallId },
    select: { date: true, hour: true, visitors: true, visitorsPrevYear: true },
  });

  if (!readings.length) {
    return { dataAvailable: false, peakHourlyVisitors: 0, hourlyProfile: [], weekdayDailyAvg: [] };
  }

  // Sum across counters first: (dateIso, hour) -> {sum, sumPrev, hasPrev}
  type DateHourSum = { sum: number; sumPrev: number; hasPrev: boolean };
  const hourlyByDate = new Map<string, DateHourSum>();
  const dailyByDate = new Map<string, DateHourSum>();

  for (const r of readings) {
    const dateKey = r.date.toISOString().split('T')[0];
    if (r.hour >= 0) {
      const key = `${dateKey}:${r.hour}`;
      const bucket = hourlyByDate.get(key) ?? { sum: 0, sumPrev: 0, hasPrev: false };
      bucket.sum += r.visitors;
      if (r.visitorsPrevYear != null) {
        bucket.sumPrev += r.visitorsPrevYear;
        bucket.hasPrev = true;
      }
      hourlyByDate.set(key, bucket);
    } else {
      const bucket = dailyByDate.get(dateKey) ?? { sum: 0, sumPrev: 0, hasPrev: false };
      bucket.sum += r.visitors;
      if (r.visitorsPrevYear != null) {
        bucket.sumPrev += r.visitorsPrevYear;
        bucket.hasPrev = true;
      }
      dailyByDate.set(dateKey, bucket);
    }
  }

  // Average per-date sums into weekday×hour buckets.
  type Group = { sumV: number; sumP: number; countV: number; countP: number };
  const hourlyGroups = new Map<string, Group>();
  for (const [key, bucket] of hourlyByDate.entries()) {
    const [dateStr, hourStr] = key.split(':');
    const weekday = new Date(dateStr + 'T00:00:00').getDay();
    const gKey = `${weekday}:${hourStr}`;
    const g = hourlyGroups.get(gKey) ?? { sumV: 0, sumP: 0, countV: 0, countP: 0 };
    g.sumV += bucket.sum;
    g.countV += 1;
    if (bucket.hasPrev) {
      g.sumP += bucket.sumPrev;
      g.countP += 1;
    }
    hourlyGroups.set(gKey, g);
  }

  const dailyGroups = new Map<number, Group>();
  for (const [dateStr, bucket] of dailyByDate.entries()) {
    const weekday = new Date(dateStr + 'T00:00:00').getDay();
    const g = dailyGroups.get(weekday) ?? { sumV: 0, sumP: 0, countV: 0, countP: 0 };
    g.sumV += bucket.sum;
    g.countV += 1;
    if (bucket.hasPrev) {
      g.sumP += bucket.sumPrev;
      g.countP += 1;
    }
    dailyGroups.set(weekday, g);
  }

  const hourlyProfile: HourlyProfileEntry[] = Array.from(hourlyGroups.entries()).map(([key, g]) => {
    const [weekday, hour] = key.split(':').map(Number);
    return {
      weekday,
      hour,
      avg: g.countV > 0 ? Math.round(g.sumV / g.countV) : 0,
      avgPrevYear: g.countP > 0 ? Math.round(g.sumP / g.countP) : null,
    };
  }).sort((a, b) => a.weekday - b.weekday || a.hour - b.hour);

  const weekdayDailyAvg: DailyProfileEntry[] = Array.from(dailyGroups.entries()).map(([weekday, g]) => ({
    weekday,
    avg: g.countV > 0 ? Math.round(g.sumV / g.countV) : 0,
    avgPrevYear: g.countP > 0 ? Math.round(g.sumP / g.countP) : null,
  }));

  const peakHourlyVisitors = hourlyProfile.length > 0
    ? Math.max(...hourlyProfile.map((p) => p.avg))
    : 0;

  return {
    dataAvailable: true,
    peakHourlyVisitors,
    hourlyProfile,
    weekdayDailyAvg,
  };
}

/**
 * Profile-based estimate for a given weekday+hour. Mirrors the
 * useCounterFootfall.estimateForHour client logic.
 */
export function estimateFromProfile(
  profile: CounterProfile,
  weekday: number,
  hour: number,
): { visitors: number; prevYear: number | null } {
  const hourEntry = profile.hourlyProfile.find((e) => e.weekday === weekday && e.hour === hour);
  if (hourEntry && hourEntry.avg > 0) {
    return { visitors: hourEntry.avg, prevYear: hourEntry.avgPrevYear };
  }
  const daily = profile.weekdayDailyAvg.find((e) => e.weekday === weekday);
  if (daily && daily.avg > 0) {
    const fraction = (HOURLY_CURVE[hour] ?? 0) / CURVE_SUM;
    return {
      visitors: Math.round(daily.avg * fraction),
      prevYear: daily.avgPrevYear != null ? Math.round(daily.avgPrevYear * fraction) : null,
    };
  }
  return { visitors: 0, prevYear: null };
}

/**
 * Live current-visitors snapshot. Same resolution order as the
 * Performance dashboard: exact today-hour counter total → weekday×hour
 * profile estimate → none.
 */
export async function getLiveFootfall(mallId: string, now: Date = new Date()): Promise<LiveFootfall> {
  const weekday = now.getDay();
  const hour = now.getHours();
  const todayStr = now.toISOString().split('T')[0];

  // Priority 1: exact-hour counter sum for today
  const todayRows = await prisma.counterReading.findMany({
    where: { mallId, hour, date: { gte: new Date(todayStr + 'T00:00:00Z'), lt: new Date(todayStr + 'T23:59:59Z') } },
    select: { visitors: true, visitorsPrevYear: true },
  });

  if (todayRows.length > 0) {
    const sum = todayRows.reduce((s, r) => s + r.visitors, 0);
    const hasPrev = todayRows.some((r) => r.visitorsPrevYear != null);
    const sumPrev = hasPrev ? todayRows.reduce((s, r) => s + (r.visitorsPrevYear ?? 0), 0) : null;
    if (sum > 0) {
      return {
        currentVisitors: sum,
        prevYear: sumPrev,
        weekday,
        hour,
        isEstimated: false,
        source: 'exact',
      };
    }
  }

  // Priority 2: profile estimate
  const profile = await getCounterProfile(mallId);
  if (profile.dataAvailable) {
    const est = estimateFromProfile(profile, weekday, hour);
    if (est.visitors > 0) {
      return {
        currentVisitors: est.visitors,
        prevYear: est.prevYear,
        weekday,
        hour,
        isEstimated: true,
        source: 'profile',
      };
    }
  }

  return {
    currentVisitors: null,
    prevYear: null,
    weekday,
    hour,
    isEstimated: false,
    source: 'none',
  };
}
