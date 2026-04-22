/**
 * @jest-environment node
 *
 * Phase D parity test — /api/admin/floorplan/[mallId]/* (6 routes).
 *
 * Pre-Phase-D leak shape (uniform across all 6 routes):
 *   - All routes were admin-gated but did NOT validate that the calling
 *     admin's customer owned the URL's mallId. A tenant admin could:
 *       * cameras GET / zones GET     — read another customer's geometry
 *       * cameras/[cameraId] PATCH    — modify another customer's camera
 *       * publish POST                — flip another customer's draft to live
 *       * save PUT                    — destructively overwrite another
 *                                       customer's floorplan zones+cameras
 *       * snapshots GET               — list another customer's snapshot
 *                                       reasons + timestamps (edit-history leak)
 *       * snapshots POST              — restore from any snapshot the
 *                                       attacker can point at, wiping
 *                                       another customer's current state
 *
 * After Phase D:
 *   - Every route is wrapped with defineHandler({ auth: 'admin', ... })
 *     and calls requireMallOwnership(session, params.mallId) before any
 *     other DB work. requireMallOwnership emits 404 for unknown mall and
 *     403 for cross-tenant.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn() },
    camera: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    floorplanZone: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
    floorplanSnapshot: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/services/floorplanBackup', () => ({
  createFloorplanSnapshot: jest.fn().mockResolvedValue(undefined),
}));

import { GET as CAMERAS_GET } from '@/app/api/admin/floorplan/[mallId]/cameras/route';
import { PATCH as CAMERA_PATCH } from '@/app/api/admin/floorplan/[mallId]/cameras/[cameraId]/route';
import { POST as PUBLISH_POST } from '@/app/api/admin/floorplan/[mallId]/publish/route';
import { GET as SNAPSHOTS_GET } from '@/app/api/admin/floorplan/[mallId]/snapshots/route';
import { GET as ZONES_GET } from '@/app/api/admin/floorplan/[mallId]/zones/route';
import prisma from '@/server/db/client';
import { auth } from '@/auth';

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock;
const cameraFindMany = (prisma as any).camera.findMany as jest.Mock;
const cameraFindUnique = (prisma as any).camera.findUnique as jest.Mock;
const cameraUpdate = (prisma as any).camera.update as jest.Mock;
const zoneFindMany = (prisma as any).floorplanZone.findMany as jest.Mock;
const zoneUpdateMany = (prisma as any).floorplanZone.updateMany as jest.Mock;
const snapshotFindMany = (prisma as any).floorplanSnapshot.findMany as jest.Mock;
const authMock = auth as unknown as jest.Mock;

function makeReq(url: string, method = 'GET', body?: unknown): Request {
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}
function ctx(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

const adminA = {
  user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
};

beforeEach(() => {
  mallFindUnique.mockReset();
  cameraFindMany.mockReset();
  cameraFindUnique.mockReset();
  cameraUpdate.mockReset();
  zoneFindMany.mockReset();
  zoneUpdateMany.mockReset();
  snapshotFindMany.mockReset();
  authMock.mockReset();
});

// Auth shapes are tested uniformly across one route; the other 5 inherit
// the same defineHandler({ auth: 'admin' }) wrapper behavior.
describe('floorplan/[mallId]/cameras GET — auth surface', () => {
  beforeEach(() => mallFindUnique.mockResolvedValue({ customerId: 'cust-A' }));

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await CAMERAS_GET(
      makeReq('http://localhost/api/admin/floorplan/m1/cameras') as any,
      ctx({ mallId: 'm1' }) as any,
    );
    expect(res.status).toBe(401);
    expect(cameraFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when authenticated user is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    });
    const res = await CAMERAS_GET(
      makeReq('http://localhost/api/admin/floorplan/m1/cameras') as any,
      ctx({ mallId: 'm1' }) as any,
    );
    expect(res.status).toBe(403);
    expect(cameraFindMany).not.toHaveBeenCalled();
  });
});

// Per-route leak coverage: 403 cross-tenant + 404 mall-missing + happy path.
describe('floorplan/[mallId]/cameras GET — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 403 when mallId belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' });
    const res = await CAMERAS_GET(
      makeReq('http://localhost/api/admin/floorplan/m-foreign/cameras') as any,
      ctx({ mallId: 'm-foreign' }) as any,
    );
    expect(res.status).toBe(403);
    expect(cameraFindMany).not.toHaveBeenCalled();
  });

  it('returns 404 when the mall does not exist', async () => {
    mallFindUnique.mockResolvedValue(null);
    const res = await CAMERAS_GET(
      makeReq('http://localhost/api/admin/floorplan/ghost/cameras') as any,
      ctx({ mallId: 'ghost' }) as any,
    );
    expect(res.status).toBe(404);
  });

  it('queries when mallId belongs to caller', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    cameraFindMany.mockResolvedValue([]);
    const res = await CAMERAS_GET(
      makeReq('http://localhost/api/admin/floorplan/m-A1/cameras?floor=ground') as any,
      ctx({ mallId: 'm-A1' }) as any,
    );
    expect(res.status).toBe(200);
    expect(cameraFindMany).toHaveBeenCalledWith({
      where: { mallId: 'm-A1', floor: 'ground' },
      orderBy: { label: 'asc' },
    });
  });
});

describe('floorplan/[mallId]/cameras/[cameraId] PATCH — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 403 when the camera belongs to another customer', async () => {
    // Phase E — ownership is now validated via camera.mall.customerId
    // directly (floorplanRepo.assertCameraOwnedByMall). The URL mallId's
    // own ownership is no longer pre-checked as a separate step — the
    // camera-side check is a strict superset.
    cameraFindUnique.mockResolvedValue({
      mallId: 'm-foreign',
      mall: { customerId: 'cust-B' },
    });
    const res = await CAMERA_PATCH(
      makeReq(
        'http://localhost/api/admin/floorplan/m-foreign/cameras/c1',
        'PATCH',
        { label: 'evil' },
      ) as any,
      ctx({ mallId: 'm-foreign', cameraId: 'c1' }) as any,
    );
    expect(res.status).toBe(403);
    expect(cameraUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when the camera is not in the (owned) mall', async () => {
    // Caller owns both malls, but passes one mallId and a cameraId from
    // the other — 404 rather than leaking existence of foreign-mall
    // cameras.
    cameraFindUnique.mockResolvedValue({
      mallId: 'other',
      mall: { customerId: 'cust-A' },
    });
    const res = await CAMERA_PATCH(
      makeReq(
        'http://localhost/api/admin/floorplan/m-A1/cameras/c-mismatch',
        'PATCH',
        { label: 'x' },
      ) as any,
      ctx({ mallId: 'm-A1', cameraId: 'c-mismatch' }) as any,
    );
    expect(res.status).toBe(404);
    expect(cameraUpdate).not.toHaveBeenCalled();
  });

  it('updates when ownership and camera both check out', async () => {
    cameraFindUnique.mockResolvedValue({
      id: 'c1',
      mallId: 'm-A1',
      mall: { customerId: 'cust-A' },
    });
    cameraUpdate.mockResolvedValue({ id: 'c1', label: 'new' });
    const res = await CAMERA_PATCH(
      makeReq(
        'http://localhost/api/admin/floorplan/m-A1/cameras/c1',
        'PATCH',
        { label: 'new' },
      ) as any,
      ctx({ mallId: 'm-A1', cameraId: 'c1' }) as any,
    );
    expect(res.status).toBe(200);
    expect(cameraUpdate).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { label: 'new' },
    });
  });
});

describe('floorplan/[mallId]/publish POST — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 403 when mall belongs to another customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' });
    const res = await PUBLISH_POST(
      makeReq(
        'http://localhost/api/admin/floorplan/m-foreign/publish',
        'POST',
        { floor: 'ground' },
      ) as any,
      ctx({ mallId: 'm-foreign' }) as any,
    );
    expect(res.status).toBe(403);
    expect(zoneUpdateMany).not.toHaveBeenCalled();
  });

  it('publishes when mall belongs to caller', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    zoneUpdateMany.mockResolvedValue({ count: 5 });
    const res = await PUBLISH_POST(
      makeReq(
        'http://localhost/api/admin/floorplan/m-A1/publish',
        'POST',
        { floor: 'ground' },
      ) as any,
      ctx({ mallId: 'm-A1' }) as any,
    );
    expect(res.status).toBe(200);
    expect(zoneUpdateMany).toHaveBeenCalledTimes(1);
    expect(zoneUpdateMany.mock.calls[0][0].where).toEqual({
      mallId: 'm-A1',
      floor: 'ground',
    });
  });
});

describe('floorplan/[mallId]/snapshots GET — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 403 when mall belongs to another customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' });
    const res = await SNAPSHOTS_GET(
      makeReq('http://localhost/api/admin/floorplan/m-foreign/snapshots') as any,
      ctx({ mallId: 'm-foreign' }) as any,
    );
    expect(res.status).toBe(403);
    expect(snapshotFindMany).not.toHaveBeenCalled();
  });

  it('lists snapshots when mall belongs to caller', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    snapshotFindMany.mockResolvedValue([
      { id: 's1', reason: 'pre-save', createdAt: new Date() },
    ]);
    const res = await SNAPSHOTS_GET(
      makeReq('http://localhost/api/admin/floorplan/m-A1/snapshots?floor=ground') as any,
      ctx({ mallId: 'm-A1' }) as any,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});

describe('floorplan/[mallId]/zones GET — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 403 when mall belongs to another customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' });
    const res = await ZONES_GET(
      makeReq('http://localhost/api/admin/floorplan/m-foreign/zones') as any,
      ctx({ mallId: 'm-foreign' }) as any,
    );
    expect(res.status).toBe(403);
    expect(zoneFindMany).not.toHaveBeenCalled();
  });

  it('lists zones when mall belongs to caller', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' });
    zoneFindMany.mockResolvedValue([]);
    const res = await ZONES_GET(
      makeReq('http://localhost/api/admin/floorplan/m-A1/zones?floor=ground') as any,
      ctx({ mallId: 'm-A1' }) as any,
    );
    expect(res.status).toBe(200);
    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { mallId: 'm-A1', floor: 'ground' },
      orderBy: { zoneId: 'asc' },
    });
  });
});
