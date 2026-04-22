/**
 * GET /api/counters/[mallId]/profile
 *
 * Returns aggregated weekday×hour profile built from CounterReading.
 * All aggregation lives in lib/data/liveFootfall.ts so Performance, this
 * route, and concierge tools stay in lock-step.
 *
 * Phase D — counters group migration. Pre-Phase-D this route had NO auth
 * and NO tenant check at all — anonymous callers could read any mall's
 * footfall profile. Both gates now enforced via defineHandler + the
 * mall-ownership guard.
 */

import { z } from 'zod';
import { defineHandler } from '@/server/api/define-handler';
import { requireMallOwnership } from '@/server/api/tenant-guards';
import { getCounterProfile, type CounterProfile } from '@/lib/data/liveFootfall';

export type { CounterProfile };
export type HourlyProfileEntry = CounterProfile['hourlyProfile'][number];

const paramsSchema = z.object({ mallId: z.string() });

export const GET = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ params, auth: session }) => {
    await requireMallOwnership(session, params.mallId);
    return await getCounterProfile(params.mallId);
  },
);
