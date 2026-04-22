/**
 * @jest-environment node
 *
 * Phase E unit tests — analysisJobRepo.
 *
 * Locks down the contract every consumer of the repo now relies on:
 *
 *   - assertOwnership throws 401/404/403 in the right cases and returns
 *     the owning customerId on the happy path.
 *   - listForCaller refuses to run without a session customerId and
 *     always injects a `mall.customerId` constraint into the where
 *     clause, even when the caller passed their own `where.mall.*`
 *     filter.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    analysisJob: { findUnique: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as analysisJobRepo from '@/server/repositories/analysis-job';
import prisma from '@/server/db/client';
import type { Session } from 'next-auth';

const jobFindUnique = (prisma as any).analysisJob.findUnique as jest.Mock;
const jobFindMany = (prisma as any).analysisJob.findMany as jest.Mock;

const sessionA: Session = {
  user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
} as Session;

const sessionNoCustomer: Session = {
  user: { id: 'u1', role: 'USER' },
} as unknown as Session;

beforeEach(() => {
  jobFindUnique.mockReset();
  jobFindMany.mockReset();
});

// ─── assertOwnership ─────────────────────────────────────────────────

describe('analysisJobRepo.assertOwnership', () => {
  it('throws HttpError(401) when the session has no customerId', async () => {
    await expect(
      analysisJobRepo.assertOwnership(sessionNoCustomer, 'job-1'),
    ).rejects.toMatchObject({ status: 401 });
    expect(jobFindUnique).not.toHaveBeenCalled();
  });

  it('throws HttpError(404) when the job does not exist', async () => {
    jobFindUnique.mockResolvedValueOnce(null);
    await expect(
      analysisJobRepo.assertOwnership(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws HttpError(403) when the job belongs to a different customer', async () => {
    jobFindUnique.mockResolvedValueOnce({ mall: { customerId: 'cust-B' } });
    await expect(
      analysisJobRepo.assertOwnership(sessionA, 'job-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws HttpError(403) when the job has no mall link', async () => {
    // Defensive: schema says mallId is non-null, but guarding against
    // a dangling relation protects us if the schema ever changes.
    jobFindUnique.mockResolvedValueOnce({ mall: null });
    await expect(
      analysisJobRepo.assertOwnership(sessionA, 'job-orphan'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns the customerId when ownership passes', async () => {
    jobFindUnique.mockResolvedValueOnce({ mall: { customerId: 'cust-A' } });
    await expect(
      analysisJobRepo.assertOwnership(sessionA, 'job-A'),
    ).resolves.toBe('cust-A');
    expect(jobFindUnique).toHaveBeenCalledWith({
      where: { id: 'job-A' },
      select: { mall: { select: { customerId: true } } },
    });
  });
});

// ─── listForCaller ───────────────────────────────────────────────────

describe('analysisJobRepo.listForCaller', () => {
  it('throws HttpError(401) when the session has no customerId', async () => {
    await expect(
      analysisJobRepo.listForCaller(sessionNoCustomer),
    ).rejects.toMatchObject({ status: 401 });
    expect(jobFindMany).not.toHaveBeenCalled();
  });

  it('injects mall.customerId constraint when no where is provided', async () => {
    jobFindMany.mockResolvedValueOnce([]);
    await analysisJobRepo.listForCaller(sessionA);
    expect(jobFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { mall: { customerId: 'cust-A' } },
      }),
    );
  });

  it('merges the caller where with the tenant constraint', async () => {
    jobFindMany.mockResolvedValueOnce([]);
    await analysisJobRepo.listForCaller(sessionA, {
      where: { status: 'PENDING', mallId: 'mall-A' },
    });
    expect(jobFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          mallId: 'mall-A',
          mall: { customerId: 'cust-A' },
        }),
      }),
    );
  });

  it('merges caller-supplied where.mall filters with the tenant constraint', async () => {
    jobFindMany.mockResolvedValueOnce([]);
    await analysisJobRepo.listForCaller(sessionA, {
      where: { mall: { status: 'LIVE' } as any },
    });
    const call = jobFindMany.mock.calls[0][0];
    expect(call.where.mall).toEqual({ status: 'LIVE', customerId: 'cust-A' });
  });

  it('forces the caller customerId even if the caller tries to override it', async () => {
    jobFindMany.mockResolvedValueOnce([]);
    await analysisJobRepo.listForCaller(sessionA, {
      where: { mall: { customerId: 'cust-B' } as any },
    });
    const call = jobFindMany.mock.calls[0][0];
    // Trust boundary: the repo's constraint overwrites any attempt by
    // the caller to pin the query to another customer.
    expect(call.where.mall.customerId).toBe('cust-A');
  });

  it('passes include, orderBy, and take through to prisma', async () => {
    jobFindMany.mockResolvedValueOnce([]);
    await analysisJobRepo.listForCaller(sessionA, {
      include: { camera: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    expect(jobFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { camera: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  });

  it('returns the rows unchanged from prisma', async () => {
    const rows = [{ id: 'job-A', mallId: 'mall-A', status: 'PENDING' }];
    jobFindMany.mockResolvedValueOnce(rows);
    await expect(analysisJobRepo.listForCaller(sessionA)).resolves.toEqual(rows);
  });
});
