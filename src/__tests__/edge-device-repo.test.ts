/**
 * @jest-environment node
 *
 * Phase E unit tests — edgeDeviceRepo.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    edgeDevice: { findUnique: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as edgeDeviceRepo from '@/server/repositories/edge-device';
import prisma from '@/server/db/client';
import type { Session } from 'next-auth';

const deviceFindUnique = (prisma as any).edgeDevice.findUnique as jest.Mock;
const deviceFindMany = (prisma as any).edgeDevice.findMany as jest.Mock;

const sessionA: Session = {
  user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
} as Session;

const sessionNoCustomer: Session = {
  user: { id: 'u1', role: 'ADMIN' },
} as unknown as Session;

beforeEach(() => {
  deviceFindUnique.mockReset();
  deviceFindMany.mockReset();
});

// ─── assertOwnership ─────────────────────────────────────────────────

describe('edgeDeviceRepo.assertOwnership', () => {
  it('throws HttpError(401) when session has no customerId', async () => {
    await expect(
      edgeDeviceRepo.assertOwnership(sessionNoCustomer, 'dev-1'),
    ).rejects.toMatchObject({ status: 401 });
    expect(deviceFindUnique).not.toHaveBeenCalled();
  });

  it('throws HttpError(404) when the device does not exist', async () => {
    deviceFindUnique.mockResolvedValueOnce(null);
    await expect(
      edgeDeviceRepo.assertOwnership(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws HttpError(403) when the device belongs to a different customer', async () => {
    deviceFindUnique.mockResolvedValueOnce({ mall: { customerId: 'cust-B' } });
    await expect(
      edgeDeviceRepo.assertOwnership(sessionA, 'dev-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws HttpError(403) when the device has no mall link', async () => {
    deviceFindUnique.mockResolvedValueOnce({ mall: null });
    await expect(
      edgeDeviceRepo.assertOwnership(sessionA, 'dev-orphan'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns the customerId when ownership passes', async () => {
    deviceFindUnique.mockResolvedValueOnce({ mall: { customerId: 'cust-A' } });
    await expect(
      edgeDeviceRepo.assertOwnership(sessionA, 'dev-A'),
    ).resolves.toBe('cust-A');
    expect(deviceFindUnique).toHaveBeenCalledWith({
      where: { id: 'dev-A' },
      select: { mall: { select: { customerId: true } } },
    });
  });
});

// ─── listForCaller ───────────────────────────────────────────────────

describe('edgeDeviceRepo.listForCaller', () => {
  it('throws 401 when session has no customerId', async () => {
    await expect(
      edgeDeviceRepo.listForCaller(sessionNoCustomer),
    ).rejects.toMatchObject({ status: 401 });
    expect(deviceFindMany).not.toHaveBeenCalled();
  });

  it('scopes the findMany by mall.customerId and orders by createdAt desc', async () => {
    deviceFindMany.mockResolvedValueOnce([]);
    await edgeDeviceRepo.listForCaller(sessionA);
    expect(deviceFindMany).toHaveBeenCalledWith({
      where: { mall: { customerId: 'cust-A' } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('passes rows through unchanged', async () => {
    const rows = [{ id: 'd1', edgeId: 'edge-1', mallId: 'mall-A' }];
    deviceFindMany.mockResolvedValueOnce(rows);
    await expect(edgeDeviceRepo.listForCaller(sessionA)).resolves.toEqual(rows);
  });
});
