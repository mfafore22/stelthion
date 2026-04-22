/**
 * @jest-environment node
 *
 * Phase E unit tests — customerRepo.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    customer: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as customerRepo from '@/server/repositories/customer';
import prisma from '@/server/db/client';
import type { Session } from 'next-auth';

const customerFindUnique = (prisma as any).customer.findUnique as jest.Mock;
const customerUpdate = (prisma as any).customer.update as jest.Mock;

const sessionA: Session = {
  user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
} as Session;

const sessionNoCustomer: Session = {
  user: { id: 'u1', role: 'USER' },
} as unknown as Session;

beforeEach(() => {
  customerFindUnique.mockReset();
  customerUpdate.mockReset();
});

// ─── assertOwnership ─────────────────────────────────────────────────

describe('customerRepo.assertOwnership', () => {
  it('throws HttpError(401) when the session has no customerId', () => {
    expect(() =>
      customerRepo.assertOwnership(sessionNoCustomer, 'cust-A'),
    ).toThrow(expect.objectContaining({ status: 401 }));
  });

  it('throws HttpError(403) when the id differs from session customerId', () => {
    expect(() => customerRepo.assertOwnership(sessionA, 'cust-B')).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });

  it('returns undefined when the ids match', () => {
    expect(customerRepo.assertOwnership(sessionA, 'cust-A')).toBeUndefined();
  });
});

// ─── findOwnWithMalls ────────────────────────────────────────────────

describe('customerRepo.findOwnWithMalls', () => {
  it('throws 401 when session has no customerId', async () => {
    await expect(
      customerRepo.findOwnWithMalls(sessionNoCustomer),
    ).rejects.toMatchObject({ status: 401 });
    expect(customerFindUnique).not.toHaveBeenCalled();
  });

  it('throws 404 when the customer row is missing', async () => {
    customerFindUnique.mockResolvedValueOnce(null);
    await expect(
      customerRepo.findOwnWithMalls(sessionA),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('queries by the caller customerId and eagerly loads malls tree', async () => {
    const row = { id: 'cust-A', name: 'Acme', malls: [] };
    customerFindUnique.mockResolvedValueOnce(row);
    await expect(customerRepo.findOwnWithMalls(sessionA)).resolves.toEqual(row);
    expect(customerFindUnique).toHaveBeenCalledWith({
      where: { id: 'cust-A' },
      include: {
        malls: {
          include: {
            stats: true,
            branding: true,
            categories: true,
          },
        },
      },
    });
  });
});

// ─── updateOwn ───────────────────────────────────────────────────────

describe('customerRepo.updateOwn', () => {
  it('throws 401 when session has no customerId', async () => {
    await expect(
      customerRepo.updateOwn(sessionNoCustomer, { name: 'Foo' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(customerUpdate).not.toHaveBeenCalled();
  });

  it('scopes the update to the caller customerId', async () => {
    customerUpdate.mockResolvedValueOnce({ id: 'cust-A', name: 'Acme Inc' });
    await customerRepo.updateOwn(sessionA, { name: 'Acme Inc' });
    expect(customerUpdate).toHaveBeenCalledWith({
      where: { id: 'cust-A' },
      data: { name: 'Acme Inc' },
    });
  });
});
