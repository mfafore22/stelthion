/**
 * @jest-environment node
 *
 * Phase D parity test — /api/concierge/* (4 routes).
 *
 * Pre-Phase-D leaks:
 *   - briefing/subscription GET: accepted client-supplied mallId in
 *     query with NO ownership check. Any authenticated user could read
 *     another tenant's briefing subscription by passing a foreign mallId.
 *
 *   - briefing/subscription PUT: accepted client-supplied mallId in body
 *     with NO ownership check. Any authenticated user could create or
 *     overwrite another tenant's briefing subscription settings.
 *
 *   - chat POST: accepted client-supplied mallId and conversationId with
 *     NO ownership checks. A user could inject messages into another
 *     tenant's conversation (using a foreign conversationId) or trigger
 *     an LLM call billed against another customer's mall — a cost-burn
 *     attack — by passing a foreign mallId.
 *
 * After Phase D:
 *   - briefing/subscription GET+PUT run requireMallOwnership before any
 *     DB read or write.
 *   - chat POST runs requireMallOwnership BEFORE creating conversations
 *     or firing the LLM stream, and requireConversationOwnership before
 *     loading history when conversationId is supplied.
 *   - briefing GET+POST also run requireMallOwnership (Phase B.5
 *     already had a local guard; now standardised via defineHandler).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn(), findFirst: jest.fn() },
    conciergeConversation: { findUnique: jest.fn(), create: jest.fn() },
    conciergeBriefing: { findUnique: jest.fn(), upsert: jest.fn() },
    conciergeBriefingSubscription: { findUnique: jest.fn(), upsert: jest.fn() },
    conciergeMessage: { findMany: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

// Prevent actual LLM / orchestration from firing in chat tests.
jest.mock('@/services/concierge/context-assembler', () => ({
  orchestrateChat: jest.fn(async function* () {}),
}));

import {
  GET as BRIEFING_GET,
  POST as BRIEFING_POST,
} from '@/app/api/concierge/briefing/route';
import {
  GET as SUB_GET,
  PUT as SUB_PUT,
} from '@/app/api/concierge/briefing/subscription/route';
import { POST as CHAT_POST } from '@/app/api/concierge/chat/route';
import prisma from '@/server/db/client';
import { auth } from '@/auth';

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock;
const mallFindFirst = (prisma as any).mall.findFirst as jest.Mock;
const convFindUnique = (prisma as any).conciergeConversation.findUnique as jest.Mock;
const convCreate = (prisma as any).conciergeConversation.create as jest.Mock;
const briefingFindUnique = (prisma as any).conciergeBriefing.findUnique as jest.Mock;
const briefingUpsert = (prisma as any).conciergeBriefing.upsert as jest.Mock;
const subFindUnique = (prisma as any).conciergeBriefingSubscription.findUnique as jest.Mock;
const subUpsert = (prisma as any).conciergeBriefingSubscription.upsert as jest.Mock;
const msgFindMany = (prisma as any).conciergeMessage.findMany as jest.Mock;
const authMock = auth as unknown as jest.Mock;

const sessionA = { user: { id: 'u1', role: 'USER', customerId: 'cust-A' } };

function makeGetReq(url: string): Request {
  return new Request(url, { method: 'GET' });
}
function makePostReq(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}
function makePutReq(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}
const emptyCtx = () => ({ params: Promise.resolve({}) });

beforeEach(() => {
  mallFindUnique.mockReset();
  mallFindFirst.mockReset();
  convFindUnique.mockReset();
  convCreate.mockReset();
  briefingFindUnique.mockReset();
  briefingUpsert.mockReset();
  subFindUnique.mockReset();
  subUpsert.mockReset();
  msgFindMany.mockReset();
  authMock.mockReset();
});

// ─── GET /api/concierge/briefing ────────────────────────────────────

describe('GET /api/concierge/briefing — tenant scope', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await BRIEFING_GET(
      makeGetReq('http://localhost/api/concierge/briefing?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 400 when mallId is missing', async () => {
    authMock.mockResolvedValue(sessionA);
    const res = await BRIEFING_GET(
      makeGetReq('http://localhost/api/concierge/briefing') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(400);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when mall belongs to another customer (no DB read fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await BRIEFING_GET(
      makeGetReq('http://localhost/api/concierge/briefing?mallId=mall-foreign') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(briefingFindUnique).not.toHaveBeenCalled();
  });

  it('returns 200 with briefing when ownership passes', async () => {
    authMock.mockResolvedValue(sessionA);
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    briefingFindUnique.mockResolvedValueOnce({ id: 'b1', content: {} });
    const res = await BRIEFING_GET(
      makeGetReq('http://localhost/api/concierge/briefing?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/concierge/briefing ───────────────────────────────────

describe('POST /api/concierge/briefing — tenant scope', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await BRIEFING_POST(
      makePostReq('http://localhost/api/concierge/briefing', { mallId: 'mall-A' }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when mall belongs to another customer (no upsert fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await BRIEFING_POST(
      makePostReq('http://localhost/api/concierge/briefing', { mallId: 'mall-foreign' }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(briefingUpsert).not.toHaveBeenCalled();
  });
});

// ─── GET /api/concierge/briefing/subscription — CRITICAL LEAK ───────

describe('GET /api/concierge/briefing/subscription — tenant scope (critical leak)', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await SUB_GET(
      makeGetReq('http://localhost/api/concierge/briefing/subscription?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 400 when mallId is missing', async () => {
    authMock.mockResolvedValue(sessionA);
    const res = await SUB_GET(
      makeGetReq('http://localhost/api/concierge/briefing/subscription') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(400);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when mall belongs to another customer (no subscription read fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    // The leak: pre-Phase-D this would reach subFindUnique with the foreign mallId.
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await SUB_GET(
      makeGetReq('http://localhost/api/concierge/briefing/subscription?mallId=mall-foreign') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(subFindUnique).not.toHaveBeenCalled();
  });

  it('returns subscription when ownership passes', async () => {
    authMock.mockResolvedValue(sessionA);
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    subFindUnique.mockResolvedValueOnce({ enabled: true, timeUtc: '07:00', sections: ['weather'] });
    const res = await SUB_GET(
      makeGetReq('http://localhost/api/concierge/briefing/subscription?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
    expect(subFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mallId_userId: { mallId: 'mall-A', userId: 'u1' } } }),
    );
  });
});

// ─── PUT /api/concierge/briefing/subscription — CRITICAL LEAK ───────

describe('PUT /api/concierge/briefing/subscription — tenant scope (critical leak)', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await SUB_PUT(
      makePutReq('http://localhost/api/concierge/briefing/subscription', { mallId: 'mall-A', enabled: true }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when mall belongs to another customer (no upsert fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    // The leak: pre-Phase-D this would reach subUpsert with the foreign mallId.
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await SUB_PUT(
      makePutReq('http://localhost/api/concierge/briefing/subscription', {
        mallId: 'mall-foreign',
        enabled: true,
      }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(subUpsert).not.toHaveBeenCalled();
  });

  it('upserts subscription when ownership passes', async () => {
    authMock.mockResolvedValue(sessionA);
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    subUpsert.mockResolvedValueOnce({ mallId: 'mall-A', userId: 'u1', enabled: true });
    const res = await SUB_PUT(
      makePutReq('http://localhost/api/concierge/briefing/subscription', {
        mallId: 'mall-A',
        enabled: true,
      }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
    expect(subUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mallId_userId: { mallId: 'mall-A', userId: 'u1' } } }),
    );
  });
});

// ─── POST /api/concierge/chat — CRITICAL LEAK ───────────────────────

describe('POST /api/concierge/chat — tenant scope (critical leak)', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await CHAT_POST(
      makePostReq('http://localhost/api/concierge/chat', { mallId: 'mall-A', message: 'hi' }) as any,
    );
    expect(res.status).toBe(401);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 400 when mallId or message is missing', async () => {
    authMock.mockResolvedValue(sessionA);
    const res = await CHAT_POST(
      makePostReq('http://localhost/api/concierge/chat', { message: 'hi' }) as any,
    );
    expect(res.status).toBe(400);
    expect(mallFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when mall belongs to another customer (no conversation created, no LLM fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    // Mall lookup resolves exact match → foreign customer.
    mallFindUnique.mockResolvedValueOnce({ mallId: 'mall-foreign' }); // prefix-resolve exact
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' }); // requireMallOwnership
    const res = await CHAT_POST(
      makePostReq('http://localhost/api/concierge/chat', {
        mallId: 'mall-foreign',
        message: 'hello',
      }) as any,
    );
    expect(res.status).toBe(403);
    // No conversation created, no LLM cost incurred.
    expect(convCreate).not.toHaveBeenCalled();
  });

  it('returns 404 when foreign conversationId is supplied (no LLM fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    // Mall resolves and is owned.
    mallFindUnique.mockResolvedValueOnce({ mallId: 'mall-A' }); // prefix-resolve exact
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' }); // requireMallOwnership
    convFindUnique.mockResolvedValueOnce(null); // requireConversationOwnership → 404
    const res = await CHAT_POST(
      makePostReq('http://localhost/api/concierge/chat', {
        mallId: 'mall-A',
        conversationId: 'ghost-conv',
        message: 'hello',
      }) as any,
    );
    expect(res.status).toBe(404);
    expect(convCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when conversationId belongs to another user (no LLM fired)', async () => {
    authMock.mockResolvedValue(sessionA);
    mallFindUnique.mockResolvedValueOnce({ mallId: 'mall-A' }); // prefix-resolve exact
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' }); // requireMallOwnership
    // The leak: pre-Phase-D any conversationId was trusted; attacker could read/write foreign chat.
    convFindUnique.mockResolvedValueOnce({ userId: 'u-other' }); // requireConversationOwnership → 403
    const res = await CHAT_POST(
      makePostReq('http://localhost/api/concierge/chat', {
        mallId: 'mall-A',
        conversationId: 'foreign-conv',
        message: 'hello',
      }) as any,
    );
    expect(res.status).toBe(403);
    expect(convCreate).not.toHaveBeenCalled();
  });
});
