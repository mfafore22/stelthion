'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';

/**
 * Hourly traffic curve (index = hour 0–23), normalised so peak = 1.0.
 * Used to distribute daily/weekly totals when no hourly data exists.
 */
const HOURLY_CURVE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 00–09
  0.08, 0.32, 0.58, 0.74,         // 10–13
  0.88, 0.96, 1.00, 0.97,         // 14–17
  0.41, 0.30, 0.14, 0.05,         // 18–21
  0, 0,                            // 22–23
];
const CURVE_SUM = HOURLY_CURVE.reduce((a, b) => a + b, 0);

// --- Types matching /api/counters/[mallId] response ---

interface HourlyEntry {
  hour: number;
  visitors: number;
  prevYear: number | null;
  year2: number | null;
  year3: number | null;
}

interface DailyEntry {
  date: string;
  visitors: number;
  visitorsPrevYear: number | null;
  estimated?: boolean;
  hourlyData?: HourlyEntry[];
}

interface CounterInfo {
  label: string;
  floor: string;
  granularity: string;
  dailyData: DailyEntry[];
  weekTotal: number;
  weekTotalPrevYear: number | null;
  deltaPercent: number | null;
}

interface CounterApiResponse {
  week: number;
  year: number;
  counters: CounterInfo[];
  availableWeeks: { week: number; year: number }[];
}

// --- Types matching /api/counters/[mallId]/profile response ---

interface ProfileHourlyEntry {
  weekday: number;
  hour: number;
  avg: number;
  avgPrevYear: number | null;
}

interface CounterProfileResponse {
  dataAvailable: boolean;
  peakHourlyVisitors: number;
  hourlyProfile: ProfileHourlyEntry[];
  weekdayDailyAvg: { weekday: number; avg: number; avgPrevYear: number | null }[];
}

export interface HourlyTotal {
  hour: number;
  visitors: number;
  prevYear: number | null;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Counter API ${r.status}`);
    return r.json();
  });

export function useCounterFootfall(mallId: string) {
  const [selectedWeek, setSelectedWeek] = useState<{ week: number; year: number } | null>(null);

  // Counter data SWR
  const swrKey = mallId
    ? selectedWeek
      ? `/api/counters/${mallId}?week=${selectedWeek.week}&year=${selectedWeek.year}`
      : `/api/counters/${mallId}`
    : null;

  const { data, isLoading } = useSWR<CounterApiResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  // Profile SWR — cached for 5 minutes, rarely changes
  const { data: profile } = useSWR<CounterProfileResponse>(
    mallId ? `/api/counters/${mallId}/profile` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );

  // Auto-select first available week
  if (!selectedWeek && data?.availableWeeks?.length) {
    setSelectedWeek(data.availableWeeks[0]);
  }

  const hasRealData = !!data?.counters?.length;
  const hasProfile = !!profile?.dataAvailable;
  const profilePeak = profile?.peakHourlyVisitors ?? 0;
  const availableWeeks = data?.availableWeeks ?? [];

  // --- Profile lookup maps ---

  const profileHourlyMap = useMemo(() => {
    if (!profile?.hourlyProfile?.length) return null;
    const m = new Map<string, { avg: number; avgPrevYear: number | null }>();
    for (const e of profile.hourlyProfile) {
      m.set(`${e.weekday}:${e.hour}`, { avg: e.avg, avgPrevYear: e.avgPrevYear });
    }
    return m;
  }, [profile]);

  const profileDailyMap = useMemo(() => {
    if (!profile?.weekdayDailyAvg?.length) return null;
    const m = new Map<number, { avg: number; avgPrevYear: number | null }>();
    for (const e of profile.weekdayDailyAvg) {
      m.set(e.weekday, { avg: e.avg, avgPrevYear: e.avgPrevYear });
    }
    return m;
  }, [profile]);

  /**
   * Returns historical average visitors for a given weekday + hour.
   * Tries hourly profile first, falls back to daily avg distributed by HOURLY_CURVE.
   */
  const estimateForHour = useMemo(() => {
    return (weekday: number, hour: number): { visitors: number; prevYear: number | null } => {
      if (profileHourlyMap) {
        const entry = profileHourlyMap.get(`${weekday}:${hour}`);
        if (entry && entry.avg > 0) return { visitors: entry.avg, prevYear: entry.avgPrevYear };
      }
      if (profileDailyMap) {
        const daily = profileDailyMap.get(weekday);
        if (daily && daily.avg > 0) {
          const fraction = HOURLY_CURVE[hour] / CURVE_SUM;
          return {
            visitors: Math.round(daily.avg * fraction),
            prevYear: daily.avgPrevYear != null ? Math.round(daily.avgPrevYear * fraction) : null,
          };
        }
      }
      return { visitors: 0, prevYear: null };
    };
  }, [profileHourlyMap, profileDailyMap]);

  /**
   * Sum hourly totals across all counters for a given date string (YYYY-MM-DD).
   * Falls back to distributing daily total by HOURLY_CURVE when no hourly breakdown.
   */
  const hourlyTotalsForDate = useMemo(() => {
    if (!data?.counters?.length) return () => [] as HourlyTotal[];

    return (dateStr: string): HourlyTotal[] => {
      const hourMap = new Map<number, { visitors: number; prevYear: number | null }>();

      for (const counter of data.counters) {
        const dayEntry = counter.dailyData.find((d) => d.date === dateStr);
        if (!dayEntry) continue;

        if (dayEntry.hourlyData?.length) {
          for (const h of dayEntry.hourlyData) {
            const existing = hourMap.get(h.hour) ?? { visitors: 0, prevYear: null };
            existing.visitors += h.visitors;
            if (h.prevYear != null) {
              existing.prevYear = (existing.prevYear ?? 0) + h.prevYear;
            }
            hourMap.set(h.hour, existing);
          }
        } else {
          const dailyTotal = dayEntry.visitors;
          const dailyPrev = dayEntry.visitorsPrevYear;
          for (let hr = 0; hr < 24; hr++) {
            if (HOURLY_CURVE[hr] === 0) continue;
            const fraction = HOURLY_CURVE[hr] / CURVE_SUM;
            const existing = hourMap.get(hr) ?? { visitors: 0, prevYear: null };
            existing.visitors += Math.round(dailyTotal * fraction);
            if (dailyPrev != null) {
              existing.prevYear = (existing.prevYear ?? 0) + Math.round(dailyPrev * fraction);
            }
            hourMap.set(hr, existing);
          }
        }
      }

      return Array.from(hourMap.entries())
        .map(([hour, vals]) => ({ hour, ...vals }))
        .sort((a, b) => a.hour - b.hour);
    };
  }, [data]);

  /**
   * Get total visitors across all counters for a specific date + hour.
   */
  const getVisitorsForHour = useMemo(() => {
    if (!hasRealData) return () => ({ visitors: 0, prevYear: null as number | null });

    return (dateStr: string, hour: number) => {
      const totals = hourlyTotalsForDate(dateStr);
      const entry = totals.find((t) => t.hour === hour);
      return entry ?? { visitors: 0, prevYear: null };
    };
  }, [hasRealData, hourlyTotalsForDate]);

  /**
   * Find the best matching date in counter data for "today" or a given weekday.
   */
  const findDateForWeekday = useMemo(() => {
    if (!data?.counters?.length) return () => null as string | null;

    const allDates = new Set<string>();
    for (const c of data.counters) {
      for (const d of c.dailyData) {
        allDates.add(d.date);
      }
    }
    const sortedDates = [...allDates].sort();

    return (targetDay?: number): string | null => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      if (allDates.has(todayStr)) return todayStr;

      const dayOfWeek = targetDay ?? today.getDay();
      for (const d of sortedDates) {
        const dt = new Date(d + 'T00:00:00');
        if (dt.getDay() === dayOfWeek) return d;
      }

      return sortedDates[sortedDates.length - 1] ?? null;
    };
  }, [data]);

  // Current hour convenience values
  const now = new Date();
  const currentHour = now.getHours();
  const todayDate = findDateForWeekday();

  const currentHourData = todayDate ? getVisitorsForHour(todayDate, currentHour) : null;
  const currentHourVisitors = currentHourData?.visitors ?? 0;
  const currentHourPrevYear = currentHourData?.prevYear ?? null;

  // isEstimated: true when today's exact date is not in the loaded counter data
  // but profile data exists (so we can fall back to historical averages)
  const isEstimated = useMemo(() => {
    if (!hasProfile) return false;
    if (!hasRealData) return true;
    const todayStr = new Date().toISOString().split('T')[0];
    for (const c of data!.counters) {
      if (c.dailyData.some((d) => d.date === todayStr)) return false;
    }
    return true;
  }, [hasProfile, hasRealData, data]);

  // Week total across all counters
  const weekTotal = useMemo(() => {
    if (!data?.counters?.length) return 0;
    return data.counters.reduce((sum, c) => sum + c.weekTotal, 0);
  }, [data]);

  const weekTotalPrevYear = useMemo(() => {
    if (!data?.counters?.length) return null;
    const total = data.counters.reduce((sum, c) => sum + (c.weekTotalPrevYear ?? 0), 0);
    return data.counters.some((c) => c.weekTotalPrevYear != null) ? total : null;
  }, [data]);

  return {
    counterData: data ?? null,
    hasRealData,
    hasProfile,
    profilePeak,
    isEstimated,
    isLoading,
    availableWeeks,
    selectedWeek,
    setSelectedWeek,
    hourlyTotalsForDate,
    getVisitorsForHour,
    findDateForWeekday,
    estimateForHour,
    currentHourVisitors,
    currentHourPrevYear,
    weekTotal,
    weekTotalPrevYear,
  };
}
