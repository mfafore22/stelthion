/**
 * @jest-environment node
 *
 * Phase E unit tests — mallRepo.
 *
 * Defines the contract of the repository module that every consumer
 * downstream now relies on. Each scoped method MUST:
 *   - Throw HttpError(401) when the session has no customerId
 *   - Throw HttpError(404) when the row is missing
 *   - Throw HttpError(403) when the row is owned by a different customer
 *   - Return the expected value on the happy path
 *
 * These tests are the single source of truth for that behaviour. Route
 * parity tests call through to the repo and will continue to pass
 * because the repo forwards to the same prisma mock.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
  },
}));

// Breaks the transitive import chain to next-auth's ESM module.
jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as mallRepo from '@/server/repositories/mall';
import prisma from '@/server/db/client';
import type { Session } from 'next-auth';

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock;
const mallFindFirst = (prisma as any).mall.findFirst as jest.Mock;
const mallFindMany = (prisma as any).mall.findMany as jest.Mock;

const sessionA: Session = {
  user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
} as Session;

const sessionNoCustomer: Session = {
  user: { id: 'u1', role: 'USER' },
} as unknown as Session;

beforeEach(() => {
  mallFindUnique.mockReset();
  mallFindFirst.mockReset();
  mallFindMany.mockReset();
});

// ─── assertOwnership ─────────────────────────────────────────────────

describe('mallRepo.assertOwnership', () => {
  it('throws HttpError(401) when the session has no customerId', async () => {
    await expect(
      mallRepo.assertOwnership(sessionNoCustomer, 'mall-A'),
    ).rejects.toMatchObject({ status: 401 });
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('throws HttpError(404) when the mall does not exist', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    await expect(
      mallRepo.assertOwnership(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws HttpError(403) when the mall belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    await expect(
      mallRepo.assertOwnership(sessionA, 'mall-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns the customerId when ownership passes', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    await expect(
      mallRepo.assertOwnership(sessionA, 'mall-A'),
    ).resolves.toBe('cust-A');
    expect(mallFindUnique).toHaveBeenCalledWith({
      where: { mallId: 'mall-A' },
      select: { customerId: true },
    });
  });
});

// ─── assertOwnershipByPk ─────────────────────────────────────────────

describe('mallRepo.assertOwnershipByPk', () => {
  it('throws HttpError(404) when the row does not exist', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    await expect(
      mallRepo.assertOwnershipByPk(sessionA, 'cuid-ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws HttpError(403) when the row belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    await expect(
      mallRepo.assertOwnershipByPk(sessionA, 'cuid-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('queries by cuid id (not mallId)', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    await mallRepo.assertOwnershipByPk(sessionA, 'cuid-1');
    expect(mallFindUnique).toHaveBeenCalledWith({
      where: { id: 'cuid-1' },
      select: { customerId: true },
    });
  });
});

// ─── findByMallId ────────────────────────────────────────────────────

describe('mallRepo.findByMallId', () => {
  it('throws 401 when session has no customerId', async () => {
    await expect(
      mallRepo.findByMallId(sessionNoCustomer, 'mall-A'),
    ).rejects.toMatchObject({ status: 401 });
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('throws 404 when the mall does not exist', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    await expect(
      mallRepo.findByMallId(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 when the mall belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B', name: 'Foreign' });
    await expect(
      mallRepo.findByMallId(sessionA, 'mall-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns the full Mall row on the happy path', async () => {
    const row = { id: 'cuid-1', mallId: 'mall-A', customerId: 'cust-A', name: 'A', city: 'Helsinki' };
    mallFindUnique.mockResolvedValueOnce(row);
    await expect(
      mallRepo.findByMallId(sessionA, 'mall-A'),
    ).resolves.toEqual(row);
  });
});

// ─── resolveMallIdOrCustomerId ───────────────────────────────────────

describe('mallRepo.resolveMallIdOrCustomerId', () => {
  it('resolves on the mallId branch when an owned mallId is supplied', async () => {
    mallFindUnique.mockResolvedValueOnce({ mallId: 'mall-A', customerId: 'cust-A' });
    await expect(
      mallRepo.resolveMallIdOrCustomerId(sessionA, 'mall-A'),
    ).resolves.toBe('mall-A');
    expect(mallFindFirst).not.toHaveBeenCalled();
  });

  it('throws 403 when mallId branch hits but it is owned by a different customer', async () => {
    mallFindUnique.mockResolvedValueOnce({ mallId: 'mall-A', customerId: 'cust-B' });
    await expect(
      mallRepo.resolveMallIdOrCustomerId(sessionA, 'mall-A'),
    ).rejects.toMatchObject({ status: 403 });
    expect(mallFindFirst).not.toHaveBeenCalled();
  });

  it('falls back to the customerId branch when the mallId branch misses', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    mallFindFirst.mockResolvedValueOnce({ mallId: 'mall-A', customerId: 'cust-A' });
    await expect(
      mallRepo.resolveMallIdOrCustomerId(sessionA, 'cust-A'),
    ).resolves.toBe('mall-A');
  });

  it('throws 404 when neither branch resolves', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    mallFindFirst.mockResolvedValueOnce(null);
    await expect(
      mallRepo.resolveMallIdOrCustomerId(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 when the customerId branch returns a foreign mall', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    mallFindFirst.mockResolvedValueOnce({ mallId: 'mall-B', customerId: 'cust-B' });
    await expect(
      mallRepo.resolveMallIdOrCustomerId(sessionA, 'cust-B'),
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ─── listForCaller ───────────────────────────────────────────────────

describe('mallRepo.listForCaller', () => {
  it('throws 401 when session has no customerId', async () => {
    await expect(
      mallRepo.listForCaller(sessionNoCustomer),
    ).rejects.toMatchObject({ status: 401 });
    expect(mallFindMany).not.toHaveBeenCalled();
  });

  it('lists malls scoped to the caller customerId', async () => {
    mallFindMany.mockResolvedValueOnce([
      { mallId: 'mall-A', name: 'A', city: 'Helsinki', status: 'LIVE' },
    ]);
    const result = await mallRepo.listForCaller(sessionA);
    expect(result).toHaveLength(1);
    expect(mallFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: 'cust-A' },
        orderBy: { name: 'asc' },
      }),
    );
  });
});

// ─── resolveMallIdUnscoped ───────────────────────────────────────────

describe('mallRepo.resolveMallIdUnscoped', () => {
  it('returns the exact mallId when it matches directly', async () => {
    mallFindUnique.mockResolvedValueOnce({ mallId: 'ideapark-lempaala' });
    await expect(
      mallRepo.resolveMallIdUnscoped('ideapark-lempaala'),
    ).resolves.toBe('ideapark-lempaala');
    expect(mallFindFirst).not.toHaveBeenCalled();
  });

  it('falls back to prefix match when the exact match misses', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    mallFindFirst.mockResolvedValueOnce({ mallId: 'ideapark-lempaala' });
    await expect(
      mallRepo.resolveMallIdUnscoped('ideapark'),
    ).resolves.toBe('ideapark-lempaala');
  });

  it('returns null when neither branch resolves', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    mallFindFirst.mockResolvedValueOnce(null);
    await expect(
      mallRepo.resolveMallIdUnscoped('ghost'),
    ).resolves.toBeNull();
  });
});

// ─── findByMallIdWithRelationsUnscoped ───────────────────────────────

describe('mallRepo.findByMallIdWithRelationsUnscoped', () => {
  it('forwards include arg to prisma', async () => {
    const row = { id: 'cuid-1', mallId: 'mall-A', stats: {}, branding: {} };
    mallFindUnique.mockResolvedValueOnce(row);
    const result = await mallRepo.findByMallIdWithRelationsUnscoped('mall-A', {
      stats: true,
      branding: true,
    });
    expect(result).toEqual(row);
    expect(mallFindUnique).toHaveBeenCalledWith({
      where: { mallId: 'mall-A' },
      include: { stats: true, branding: true },
    });
  });

  it('returns null when the mall does not exist (no throw)', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    await expect(
      mallRepo.findByMallIdWithRelationsUnscoped('ghost', { stats: true }),
    ).resolves.toBeNull();
  });
});
