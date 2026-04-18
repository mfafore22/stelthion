import { NextRequest, NextResponse } from 'next/server';
import { getCounterProfile, type CounterProfile } from '@/lib/data/liveFootfall';

export type { CounterProfile };
export type HourlyProfileEntry = CounterProfile['hourlyProfile'][number];

/**
 * GET /api/counters/[mallId]/profile
 *
 * Returns aggregated weekday×hour profile built from CounterReading.
 * All aggregation lives in lib/data/liveFootfall.ts so Performance,
 * this route, and concierge tools stay in lock-step.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const { mallId } = await params;
  const profile = await getCounterProfile(mallId);
  return NextResponse.json(profile);
}
