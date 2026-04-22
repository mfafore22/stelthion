/**
 * @jest-environment node
 *
 * Phase D parity test — /api/counters/[mallId]* (counters group).
 *
 * Pre-Phase-D leaks:
 *   - GET /api/counters/[mallId]: trusted client-supplied mallId AND fell
 *     back to treating it as a customerId on miss, with no ownership check
 *     in either branch.
 *   - GET /api/counters/[mallId]/profile: had NO auth at all — anonymous
 *     read of any mall's footfall profile.
 *   - GET /api/counters/[mallId]/export: required a session but did not
 *     check mall ownership.
 *
 * After Phase D:
 *   - All three routes are wrapped with defineHandler, require a session,
 *     and call requireMallOwnership (or the inline equivalent in the main
 *     route, which also enforces ownership in the customerId-fallback
 *     branch).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn(), findFirst: jest.fn() },
    counterReading: { groupBy: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

jest.mock('@/lib/data/liveFootfall', () => ({
  getCounterProfile: jest.fn(),
}));

import { GET as MAIN } from '@/app/api/counters/[mallId]/route';
import { GET as PROFILE } from '@/app/api/counters/[mallId]/profile/route';
import { GET as EXPORT } from '@/app/api/counters/[mallId]/export/route';
import prisma from '@/server/db/client';
import { auth } from '@/auth';
import { getCounterProfile } from '@/lib/data/liveFootfall';

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock;
const mallFindFirst = (prisma as any).mall.findFirst as jest.Mock;
const counterGroupBy = (prisma as any).counterReading.groupBy as jest.Mock;
const counterFindMany = (prisma as any).counterReading.findMany as jest.Mock;
const authMock = auth as unknown as jest.Mock;
const profileMock = getCounterProfile as unknown as jest.Mock;

function makeReq(path: string): Request {
  return new Request(`http://localhost${path}`, { method: 'GET' });
}

function makeCtx(mallId: string) {
  return { params: Promise.resolve({ mallId }) };
}

beforeEach(() => {
  mallFindUnique.mockReset();
  mallFindFirst.mockReset();
  counterGroupBy.mockReset();
  counterFindMany.mockReset();
  authMock.mockReset();
  profileMock.mockReset();
});

// ─── Main route ─────────────────────────────────────────────────────

describe('GET /api/counters/[mallId] — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  );

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await MAIN(makeReq('/api/counters/mall-A1') as any, makeCtx('mall-A1') as any);
    expect(res.status).toBe(401);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('rejects with 403 when mallId belongs to another customer', async () => {
    mallFindUnique.mockResolvedValue({ mallId: 'mall-B1', customerId: 'cust-B' });
    const res = await MAIN(makeReq('/api/counters/mall-B1') as any, makeCtx('mall-B1') as any);
    expect(res.status).toBe(403);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('rejects with 403 when customerId-fallback branch resolves to another customer', async () => {
    // mallId miss → fallback findFirst by customerId — but the resolved
    // mall belongs to a different customer. Pre-Phase-D this returned data.
    mallFindUnique.mockResolvedValue(null);
    mallFindFirst.mockResolvedValue({ mallId: 'mall-B1', customerId: 'cust-B' });
    const res = await MAIN(makeReq('/api/counters/cust-B') as any, makeCtx('cust-B') as any);
    expect(res.status).toBe(403);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('returns 404 when neither mallId nor customerId resolves', async () => {
    mallFindUnique.mockResolvedValue(null);
    mallFindFirst.mockResolvedValue(null);
    const res = await MAIN(makeReq('/api/counters/ghost') as any, makeCtx('ghost') as any);
    expect(res.status).toBe(404);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('queries readings when ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ mallId: 'mall-A1', customerId: 'cust-A' });
    counterGroupBy.mockResolvedValue([{ year: 2026, weekNumber: 17 }]);
    counterFindMany.mockResolvedValue([]);

    const res = await MAIN(
      makeReq('/api/counters/mall-A1?week=17&year=2026') as any,
      makeCtx('mall-A1') as any,
    );

    expect(res.status).toBe(200);
    expect(counterGroupBy).toHaveBeenCalledTimes(1);
    expect(counterGroupBy.mock.calls[0][0].where).toEqual({ mallId: 'mall-A1' });
  });

  it('honors the customerId-fallback branch when ownership matches', async () => {
    // Pass customerId in the path; mallId lookup misses; customerId
    // findFirst returns a mall owned by the same customer. Should return
    // 200 and use the resolved mallId for the readings query.
    mallFindUnique.mockResolvedValue(null);
    mallFindFirst.mockResolvedValue({ mallId: 'mall-A1', customerId: 'cust-A' });
    counterGroupBy.mockResolvedValue([]);
    counterFindMany.mockResolvedValue([]);

    const res = await MAIN(makeReq('/api/counters/cust-A') as any, makeCtx('cust-A') as any);
    expect(res.status).toBe(200);
    expect(counterGroupBy.mock.calls[0][0].where).toEqual({ mallId: 'mall-A1' });
  });
});

// ─── Profile route ──────────────────────────────────────────────────

describe('GET /api/counters/[mallId]/profile — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  );

  it('returns 401 when no session (closes pre-Phase-D anon read)', async () => {
    authMock.mockResolvedValue(null);
    const res = await PROFILE(
      makeReq('/api/counters/mall-A1/profile') as any,
      makeCtx('mall-A1') as any,
    );
    expect(res.status).toBe(401);
    expect(profileMock).not.toHaveBeenCalled();
  });

  it('rejects with 403 when mallId belongs to another customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' });
    const res = await PROFILE(
      makeReq('/api/counters/mall-B1/profile') as any,
      makeCtx('mall-B1') as any,
    );
    expect(res.status).toBe(403);
    expect(profileMock).not.toHaveBeenCalled();
  });

  it('returns 404 when mallId is unknown', async () => {
    mallFindUnique.mockResolvedValue(null);
    const res = await PROFILE(
      makeReq('/api/counters/ghost/profile') as any,
      makeCtx('ghost') as any,
    );
    expect(res.status).toBe(404);
    expect(profileMock).not.toHaveBeenCalled();
  });

  it('returns the profile when ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    profileMock.mockResolvedValue({
      dataAvailable: true,
      peakHourlyVisitors: 100,
      hourlyProfile: [],
      weekdayDailyAvg: [],
    });

    const res = await PROFILE(
      makeReq('/api/counters/mall-A1/profile') as any,
      makeCtx('mall-A1') as any,
    );

    expect(res.status).toBe(200);
    expect(profileMock).toHaveBeenCalledWith('mall-A1');
  });
});

// ─── Export route ───────────────────────────────────────────────────

describe('GET /api/counters/[mallId]/export — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  );

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await EXPORT(
      makeReq('/api/counters/mall-A1/export?week=17&year=2026') as any,
      makeCtx('mall-A1') as any,
    );
    expect(res.status).toBe(401);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('rejects with 403 when mallId belongs to another customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' });
    const res = await EXPORT(
      makeReq('/api/counters/mall-B1/export?week=17&year=2026') as any,
      makeCtx('mall-B1') as any,
    );
    expect(res.status).toBe(403);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('returns 404 when mallId is unknown', async () => {
    mallFindUnique.mockResolvedValue(null);
    const res = await EXPORT(
      makeReq('/api/counters/ghost/export?week=17&year=2026') as any,
      makeCtx('ghost') as any,
    );
    expect(res.status).toBe(404);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('returns 400 when week or year missing', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    const res = await EXPORT(
      makeReq('/api/counters/mall-A1/export') as any,
      makeCtx('mall-A1') as any,
    );
    expect(res.status).toBe(400);
    expect(counterFindMany).not.toHaveBeenCalled();
  });

  it('returns CSV when ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    counterFindMany.mockResolvedValue([
      {
        date: new Date('2026-04-22T00:00:00Z'),
        hour: 12,
        counterLabel: 'Main',
        floor: 1,
        visitors: 50,
        visitorsPrevYear: 40,
      },
    ]);

    const res = await EXPORT(
      makeReq('/api/counters/mall-A1/export?week=17&year=2026') as any,
      makeCtx('mall-A1') as any,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    const body = await res.text();
    expect(body).toContain('Date,Hour,Counter,Floor,Visitors');
    expect(body).toContain('2026-04-22,12,Main,1,50,40,25.0');
  });
});
