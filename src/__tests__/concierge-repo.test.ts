/**
 * @jest-environment node
 *
 * Phase E unit tests — conciergeRepo.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    conciergeConversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conciergeMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    conciergeBriefing: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    conciergeBriefingSubscription: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/server/repositories/mall', () => ({
  __esModule: true,
  assertOwnership: jest.fn(),
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as conciergeRepo from '@/server/repositories/concierge';
import * as mallRepo from '@/server/repositories/mall';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';
import type { Session } from 'next-auth';

const convFindUnique = (prisma as any).conciergeConversation.findUnique as jest.Mock;
const convCreate = (prisma as any).conciergeConversation.create as jest.Mock;
const convUpdate = (prisma as any).conciergeConversation.update as jest.Mock;
const msgCreate = (prisma as any).conciergeMessage.create as jest.Mock;
const msgFindMany = (prisma as any).conciergeMessage.findMany as jest.Mock;
const briefingFindUnique = (prisma as any).conciergeBriefing.findUnique as jest.Mock;
const briefingUpsert = (prisma as any).conciergeBriefing.upsert as jest.Mock;
const briefingCreate = (prisma as any).conciergeBriefing.create as jest.Mock;
const subFindUnique = (prisma as any).conciergeBriefingSubscription.findUnique as jest.Mock;
const subUpsert = (prisma as any).conciergeBriefingSubscription.upsert as jest.Mock;
const subFindMany = (prisma as any).conciergeBriefingSubscription.findMany as jest.Mock;
const assertOwnership = (mallRepo as any).assertOwnership as jest.Mock;

const sessionA: Session = {
  user: { id: 'user-A', role: 'USER', customerId: 'cust-A' },
} as Session;

const sessionNoUser: Session = {
  user: { role: 'USER', customerId: 'cust-A' },
} as unknown as Session;

beforeEach(() => {
  convFindUnique.mockReset();
  convCreate.mockReset();
  convUpdate.mockReset();
  msgCreate.mockReset();
  msgFindMany.mockReset();
  briefingFindUnique.mockReset();
  briefingUpsert.mockReset();
  briefingCreate.mockReset();
  subFindUnique.mockReset();
  subUpsert.mockReset();
  subFindMany.mockReset();
  assertOwnership.mockReset();
});

// ─── assertConversationOwnership ─────────────────────────────────────

describe('conciergeRepo.assertConversationOwnership', () => {
  it('throws 401 when session has no user id', async () => {
    await expect(
      conciergeRepo.assertConversationOwnership(sessionNoUser, 'conv-1'),
    ).rejects.toMatchObject({ status: 401 });
    expect(convFindUnique).not.toHaveBeenCalled();
  });

  it('throws 404 when the conversation does not exist', async () => {
    convFindUnique.mockResolvedValueOnce(null);
    await expect(
      conciergeRepo.assertConversationOwnership(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 403 when the conversation belongs to another user', async () => {
    convFindUnique.mockResolvedValueOnce({ userId: 'user-B' });
    await expect(
      conciergeRepo.assertConversationOwnership(sessionA, 'conv-foreign'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('resolves when the caller owns the conversation', async () => {
    convFindUnique.mockResolvedValueOnce({ userId: 'user-A' });
    await expect(
      conciergeRepo.assertConversationOwnership(sessionA, 'conv-own'),
    ).resolves.toBeUndefined();
    expect(convFindUnique).toHaveBeenCalledWith({
      where: { id: 'conv-own' },
      select: { userId: true },
    });
  });
});

// ─── createConversationForCaller ─────────────────────────────────────

describe('conciergeRepo.createConversationForCaller', () => {
  it('propagates mall ownership failure before creating', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      conciergeRepo.createConversationForCaller(sessionA, 'mall-X', 'hi'),
    ).rejects.toMatchObject({ status: 403 });
    expect(convCreate).not.toHaveBeenCalled();
  });

  it('creates the conversation with session user id and passed title', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    convCreate.mockResolvedValueOnce({ id: 'conv-1' });
    await conciergeRepo.createConversationForCaller(sessionA, 'mall-A', 'hello');
    expect(convCreate).toHaveBeenCalledWith({
      data: { mallId: 'mall-A', userId: 'user-A', title: 'hello' },
    });
  });
});

// ─── appendMessageForCaller ──────────────────────────────────────────

describe('conciergeRepo.appendMessageForCaller', () => {
  it('re-asserts conversation ownership before inserting', async () => {
    convFindUnique.mockResolvedValueOnce({ userId: 'user-B' });
    await expect(
      conciergeRepo.appendMessageForCaller(sessionA, 'conv-foreign', {
        sender: 'user',
        content: 'x',
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(msgCreate).not.toHaveBeenCalled();
  });

  it('inserts with conversationId injected', async () => {
    convFindUnique.mockResolvedValueOnce({ userId: 'user-A' });
    msgCreate.mockResolvedValueOnce({ id: 'm1' });
    await conciergeRepo.appendMessageForCaller(sessionA, 'conv-own', {
      sender: 'user',
      content: 'hi',
    });
    expect(msgCreate).toHaveBeenCalledWith({
      data: { sender: 'user', content: 'hi', conversationId: 'conv-own' },
    });
  });
});

// ─── listMessagesForCaller ───────────────────────────────────────────

describe('conciergeRepo.listMessagesForCaller', () => {
  it('asserts ownership then findMany with default take=40', async () => {
    convFindUnique.mockResolvedValueOnce({ userId: 'user-A' });
    msgFindMany.mockResolvedValueOnce([]);
    await conciergeRepo.listMessagesForCaller(sessionA, 'conv-own');
    expect(msgFindMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-own' },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });
  });
});

// ─── touchConversationForCaller ──────────────────────────────────────

describe('conciergeRepo.touchConversationForCaller', () => {
  it('propagates ownership failure before update', async () => {
    convFindUnique.mockResolvedValueOnce(null);
    await expect(
      conciergeRepo.touchConversationForCaller(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
    expect(convUpdate).not.toHaveBeenCalled();
  });
});

// ─── Briefing ────────────────────────────────────────────────────────

describe('conciergeRepo.getBriefingForCaller', () => {
  it('propagates mall ownership failure', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      conciergeRepo.getBriefingForCaller(sessionA, 'mall-X', new Date()),
    ).rejects.toMatchObject({ status: 403 });
    expect(briefingFindUnique).not.toHaveBeenCalled();
  });

  it('queries by composite (mallId, session.userId, date)', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    briefingFindUnique.mockResolvedValueOnce(null);
    const date = new Date('2026-04-22T00:00:00.000Z');
    await conciergeRepo.getBriefingForCaller(sessionA, 'mall-A', date);
    expect(briefingFindUnique).toHaveBeenCalledWith({
      where: { mallId_userId_date: { mallId: 'mall-A', userId: 'user-A', date } },
    });
  });
});

describe('conciergeRepo.upsertBriefingForCaller', () => {
  it('upserts with session userId hard-coded (caller cannot forge another user)', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    briefingUpsert.mockResolvedValueOnce({ id: 'b1' });
    const date = new Date('2026-04-22T00:00:00.000Z');
    await conciergeRepo.upsertBriefingForCaller(sessionA, 'mall-A', date, { ok: true });
    expect(briefingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { mallId_userId_date: { mallId: 'mall-A', userId: 'user-A', date } },
      }),
    );
  });
});

// ─── Subscription ────────────────────────────────────────────────────

describe('conciergeRepo.getSubscriptionForCaller', () => {
  it('queries by (mallId, session.userId)', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    subFindUnique.mockResolvedValueOnce(null);
    await conciergeRepo.getSubscriptionForCaller(sessionA, 'mall-A');
    expect(subFindUnique).toHaveBeenCalledWith({
      where: { mallId_userId: { mallId: 'mall-A', userId: 'user-A' } },
    });
  });
});

describe('conciergeRepo.upsertSubscriptionForCaller', () => {
  it('fills in defaults on create', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    subUpsert.mockResolvedValueOnce({ id: 's1' });
    await conciergeRepo.upsertSubscriptionForCaller(sessionA, 'mall-A', {});
    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          mallId: 'mall-A',
          userId: 'user-A',
          enabled: true,
          timeUtc: '06:00',
          sections: ['weather', 'footfall', 'events', 'transport'],
        },
      }),
    );
  });

  it('only includes provided fields in update branch', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    subUpsert.mockResolvedValueOnce({ id: 's1' });
    await conciergeRepo.upsertSubscriptionForCaller(sessionA, 'mall-A', {
      enabled: false,
    });
    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { enabled: false },
      }),
    );
  });
});

// ─── Unscoped (cron) ─────────────────────────────────────────────────

describe('conciergeRepo Unscoped helpers', () => {
  it('listEnabledSubscriptionsUnscoped filters on enabled:true with no session scope', async () => {
    subFindMany.mockResolvedValueOnce([]);
    await conciergeRepo.listEnabledSubscriptionsUnscoped();
    expect(subFindMany).toHaveBeenCalledWith({ where: { enabled: true } });
    expect(assertOwnership).not.toHaveBeenCalled();
  });

  it('findBriefingByKeyUnscoped queries the composite key', async () => {
    briefingFindUnique.mockResolvedValueOnce(null);
    const date = new Date('2026-04-22T00:00:00.000Z');
    await conciergeRepo.findBriefingByKeyUnscoped('mall-A', 'user-X', date);
    expect(briefingFindUnique).toHaveBeenCalledWith({
      where: { mallId_userId_date: { mallId: 'mall-A', userId: 'user-X', date } },
    });
  });

  it('createBriefingUnscoped creates without an ownership check', async () => {
    briefingCreate.mockResolvedValueOnce({ id: 'b1' });
    const date = new Date('2026-04-22T00:00:00.000Z');
    await conciergeRepo.createBriefingUnscoped('mall-A', 'user-X', date, { ok: true });
    expect(briefingCreate).toHaveBeenCalled();
    expect(assertOwnership).not.toHaveBeenCalled();
  });
});
