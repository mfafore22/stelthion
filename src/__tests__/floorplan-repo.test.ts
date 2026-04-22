/**
 * @jest-environment node
 *
 * Phase E unit tests — floorplanRepo.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    floorplanZone: { count: jest.fn(), findMany: jest.fn() },
    camera: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  },
}));

jest.mock('@/server/repositories/mall', () => ({
  __esModule: true,
  assertOwnership: jest.fn(),
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as floorplanRepo from '@/server/repositories/floorplan';
import * as mallRepo from '@/server/repositories/mall';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';
import type { Session } from 'next-auth';

const zoneCount = (prisma as any).floorplanZone.count as jest.Mock;
const zoneFindMany = (prisma as any).floorplanZone.findMany as jest.Mock;
const cameraCount = (prisma as any).camera.count as jest.Mock;
const cameraFindMany = (prisma as any).camera.findMany as jest.Mock;
const cameraFindUnique = (prisma as any).camera.findUnique as jest.Mock;
const assertOwnership = (mallRepo as any).assertOwnership as jest.Mock;

const sessionA: Session = {
  user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
} as Session;

const sessionNoCustomer: Session = {
  user: { id: 'u1', role: 'ADMIN' },
} as unknown as Session;

beforeEach(() => {
  zoneCount.mockReset();
  zoneFindMany.mockReset();
  cameraCount.mockReset();
  cameraFindMany.mockReset();
  cameraFindUnique.mockReset();
  assertOwnership.mockReset();
});

// ─── count helpers ───────────────────────────────────────────────────

describe('floorplanRepo.countZonesForCaller', () => {
  it('throws 401 without customerId', async () => {
    await expect(
      floorplanRepo.countZonesForCaller(sessionNoCustomer),
    ).rejects.toMatchObject({ status: 401 });
    expect(zoneCount).not.toHaveBeenCalled();
  });

  it('scopes count through mall.customerId', async () => {
    zoneCount.mockResolvedValueOnce(7);
    await expect(floorplanRepo.countZonesForCaller(sessionA)).resolves.toBe(7);
    expect(zoneCount).toHaveBeenCalledWith({
      where: { mall: { customerId: 'cust-A' } },
    });
  });
});

describe('floorplanRepo.countCamerasForCaller', () => {
  it('throws 401 without customerId', async () => {
    await expect(
      floorplanRepo.countCamerasForCaller(sessionNoCustomer),
    ).rejects.toMatchObject({ status: 401 });
    expect(cameraCount).not.toHaveBeenCalled();
  });

  it('scopes count through mall.customerId', async () => {
    cameraCount.mockResolvedValueOnce(3);
    await expect(floorplanRepo.countCamerasForCaller(sessionA)).resolves.toBe(3);
    expect(cameraCount).toHaveBeenCalledWith({
      where: { mall: { customerId: 'cust-A' } },
    });
  });
});

// ─── assertCameraOwnershipByPk ───────────────────────────────────────

describe('floorplanRepo.assertCameraOwnershipByPk', () => {
  it('throws 401 without customerId', async () => {
    await expect(
      floorplanRepo.assertCameraOwnershipByPk(sessionNoCustomer, 'c1'),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws 404 when the camera does not exist', async () => {
    cameraFindUnique.mockResolvedValueOnce(null);
    await expect(
      floorplanRepo.assertCameraOwnershipByPk(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 when the camera belongs to another customer', async () => {
    cameraFindUnique.mockResolvedValueOnce({
      mallId: 'mall-B',
      mall: { customerId: 'cust-B' },
    });
    await expect(
      floorplanRepo.assertCameraOwnershipByPk(sessionA, 'c-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 when the camera has no mall link', async () => {
    cameraFindUnique.mockResolvedValueOnce({ mallId: null, mall: null });
    await expect(
      floorplanRepo.assertCameraOwnershipByPk(sessionA, 'c-orphan'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns the camera mallId when ownership passes', async () => {
    cameraFindUnique.mockResolvedValueOnce({
      mallId: 'mall-A',
      mall: { customerId: 'cust-A' },
    });
    await expect(
      floorplanRepo.assertCameraOwnershipByPk(sessionA, 'c1'),
    ).resolves.toBe('mall-A');
  });
});

// ─── Unscoped helpers ────────────────────────────────────────────────

describe('floorplanRepo.listPublishedZonesForMallUnscoped', () => {
  it('filters on publishedAt not null', async () => {
    zoneFindMany.mockResolvedValueOnce([]);
    await floorplanRepo.listPublishedZonesForMallUnscoped('mall-A');
    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A', publishedAt: { not: null } },
      orderBy: { zoneId: 'asc' },
    });
  });

  it('includes floor in where when passed', async () => {
    zoneFindMany.mockResolvedValueOnce([]);
    await floorplanRepo.listPublishedZonesForMallUnscoped('mall-A', 'ground');
    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A', publishedAt: { not: null }, floor: 'ground' },
      orderBy: { zoneId: 'asc' },
    });
  });
});

describe('floorplanRepo.listActiveCamerasForMallUnscoped', () => {
  it('filters on active:true', async () => {
    cameraFindMany.mockResolvedValueOnce([]);
    await floorplanRepo.listActiveCamerasForMallUnscoped('mall-A');
    expect(cameraFindMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A', active: true },
      orderBy: { label: 'asc' },
    });
  });
});

// ─── Scoped list helpers ─────────────────────────────────────────────

describe('floorplanRepo.listZonesForMall', () => {
  it('propagates mall ownership failure', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      floorplanRepo.listZonesForMall(sessionA, 'mall-X'),
    ).rejects.toMatchObject({ status: 403 });
    expect(zoneFindMany).not.toHaveBeenCalled();
  });

  it('queries unfiltered by publishedAt (admin view includes drafts)', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    zoneFindMany.mockResolvedValueOnce([]);
    await floorplanRepo.listZonesForMall(sessionA, 'mall-A');
    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A' },
      orderBy: { zoneId: 'asc' },
    });
  });
});

describe('floorplanRepo.listCamerasForMall', () => {
  it('propagates mall ownership failure', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      floorplanRepo.listCamerasForMall(sessionA, 'mall-X'),
    ).rejects.toMatchObject({ status: 403 });
    expect(cameraFindMany).not.toHaveBeenCalled();
  });
});
