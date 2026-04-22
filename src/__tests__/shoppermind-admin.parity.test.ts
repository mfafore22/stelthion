/**
 * @jest-environment node
 *
 * Phase D parity test — /api/shoppermind/* (6 routes).
 *
 * Shoppermind routes are admin-only over a global (non-tenant-scoped)
 * dataset. Pre-Phase-D they used the raw requireAdmin() guard which
 * returned 401 for unauthenticated and 403 for non-admins. After Phase D
 * they use defineHandler({ auth: 'admin' }) which produces the same
 * HTTP codes — this test confirms the behaviour is preserved.
 *
 * Additional fix in Phase D:
 *   - phenomena/[id]/feedback POST previously accepted `userId` in the
 *     request body, allowing an admin to attribute feedback to any other
 *     user. After Phase D the route ignores body.userId and always uses
 *     session.user.id.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    phenomenon: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    phenomenonFeedback: { create: jest.fn() },
    signalOfTheDay: { findMany: jest.fn() },
    signalSource: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

jest.mock('@/services/shoppermind/weights', () => ({
  recalculateWeights: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/shoppermind/embedding', () => ({
  getEmbeddingClient: jest.fn(() => ({
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  })),
}));

jest.mock('@/lib/stats', () => ({
  cosineSimilarity: jest.fn().mockReturnValue(0.9),
}));

import {
  GET as PHENOMENA_GET,
} from '@/app/api/shoppermind/phenomena/route';
import {
  GET as PHENOMENON_GET,
} from '@/app/api/shoppermind/phenomena/[id]/route';
import {
  POST as FEEDBACK_POST,
} from '@/app/api/shoppermind/phenomena/[id]/feedback/route';
import {
  GET as SEARCH_GET,
} from '@/app/api/shoppermind/search/route';
import {
  GET as SIGNALS_GET,
} from '@/app/api/shoppermind/signals-of-the-day/route';
import {
  GET as SOURCES_GET,
  POST as SOURCES_POST,
} from '@/app/api/shoppermind/sources/route';
import prisma from '@/server/db/client';
import { auth } from '@/auth';

const phenomenonFindUnique = (prisma as any).phenomenon.findUnique as jest.Mock;
const phenomenonFindMany = (prisma as any).phenomenon.findMany as jest.Mock;
const phenomenonCount = (prisma as any).phenomenon.count as jest.Mock;
const feedbackCreate = (prisma as any).phenomenonFeedback.create as jest.Mock;
const signalFindMany = (prisma as any).signalOfTheDay.findMany as jest.Mock;
const sourceFindMany = (prisma as any).signalSource.findMany as jest.Mock;
const sourceCreate = (prisma as any).signalSource.create as jest.Mock;
const authMock = auth as unknown as jest.Mock;

const adminA = { user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' } };
const nonAdmin = { user: { id: 'u2', role: 'USER', customerId: 'cust-A' } };

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
const emptyCtx = () => ({ params: Promise.resolve({}) });
const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  phenomenonFindUnique.mockReset();
  phenomenonFindMany.mockReset();
  phenomenonCount.mockReset();
  feedbackCreate.mockReset();
  signalFindMany.mockReset();
  sourceFindMany.mockReset();
  sourceCreate.mockReset();
  authMock.mockReset();
});

// ─── GET /api/shoppermind/phenomena ─────────────────────────────────

describe('GET /api/shoppermind/phenomena — admin gate', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await PHENOMENA_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(phenomenonFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when authenticated but not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await PHENOMENA_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(phenomenonFindMany).not.toHaveBeenCalled();
  });

  it('returns 200 for ADMIN', async () => {
    authMock.mockResolvedValue(adminA);
    phenomenonFindMany.mockResolvedValueOnce([]);
    phenomenonCount.mockResolvedValueOnce(0);
    const res = await PHENOMENA_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
  });
});

// ─── GET /api/shoppermind/phenomena/[id] ────────────────────────────

describe('GET /api/shoppermind/phenomena/[id] — admin gate', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await PHENOMENON_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena/p1') as any,
      idCtx('p1') as any,
    );
    expect(res.status).toBe(401);
    expect(phenomenonFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await PHENOMENON_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena/p1') as any,
      idCtx('p1') as any,
    );
    expect(res.status).toBe(403);
    expect(phenomenonFindUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when phenomenon does not exist', async () => {
    authMock.mockResolvedValue(adminA);
    phenomenonFindUnique.mockResolvedValueOnce(null);
    const res = await PHENOMENON_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena/ghost') as any,
      idCtx('ghost') as any,
    );
    expect(res.status).toBe(404);
  });

  it('returns phenomenon for ADMIN', async () => {
    authMock.mockResolvedValue(adminA);
    phenomenonFindUnique.mockResolvedValueOnce({ id: 'p1', label: 'Test' });
    const res = await PHENOMENON_GET(
      makeGetReq('http://localhost/api/shoppermind/phenomena/p1') as any,
      idCtx('p1') as any,
    );
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/shoppermind/phenomena/[id]/feedback ──────────────────

describe('POST /api/shoppermind/phenomena/[id]/feedback — admin gate + userId-spoof fix', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await FEEDBACK_POST(
      makePostReq('http://localhost/api/shoppermind/phenomena/p1/feedback', {
        verdict: 'approve',
        userId: 'attacker',
      }) as any,
      idCtx('p1') as any,
    );
    expect(res.status).toBe(401);
    expect(phenomenonFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await FEEDBACK_POST(
      makePostReq('http://localhost/api/shoppermind/phenomena/p1/feedback', { verdict: 'approve' }) as any,
      idCtx('p1') as any,
    );
    expect(res.status).toBe(403);
    expect(feedbackCreate).not.toHaveBeenCalled();
  });

  it('creates feedback using session.user.id, ignoring any body userId (userId-spoof fix)', async () => {
    authMock.mockResolvedValue(adminA);
    phenomenonFindUnique.mockResolvedValueOnce({ id: 'p1', primaryCountry: 'FI' });
    feedbackCreate.mockResolvedValueOnce({ id: 'fb1', userId: 'u1', verdict: 'approve' });

    const res = await FEEDBACK_POST(
      makePostReq('http://localhost/api/shoppermind/phenomena/p1/feedback', {
        verdict: 'approve',
        userId: 'attacker-user-id',
      }) as any,
      idCtx('p1') as any,
    );

    expect(res.status).toBe(200);
    // The fix: userId must be session.user.id ('u1'), not the body value ('attacker-user-id').
    expect(feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'u1' }),
      }),
    );
    expect(feedbackCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'attacker-user-id' }),
      }),
    );
  });
});

// ─── GET /api/shoppermind/search ────────────────────────────────────

describe('GET /api/shoppermind/search — admin gate', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await SEARCH_GET(
      makeGetReq('http://localhost/api/shoppermind/search?q=test') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await SEARCH_GET(
      makeGetReq('http://localhost/api/shoppermind/search?q=test') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
  });

  it('returns 400 when q param is missing', async () => {
    authMock.mockResolvedValue(adminA);
    const res = await SEARCH_GET(
      makeGetReq('http://localhost/api/shoppermind/search') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(400);
  });

  it('returns results for ADMIN', async () => {
    authMock.mockResolvedValue(adminA);
    phenomenonFindMany.mockResolvedValueOnce([
      { id: 'p1', label: 'Test', centroid: [0.1, 0.2, 0.3], description: '', primaryCountry: 'FI', state: 'active', categories: [] },
    ]);
    const res = await SEARCH_GET(
      makeGetReq('http://localhost/api/shoppermind/search?q=test') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
  });
});

// ─── GET /api/shoppermind/signals-of-the-day ────────────────────────

describe('GET /api/shoppermind/signals-of-the-day — admin gate', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await SIGNALS_GET(
      makeGetReq('http://localhost/api/shoppermind/signals-of-the-day') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(signalFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await SIGNALS_GET(
      makeGetReq('http://localhost/api/shoppermind/signals-of-the-day') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(signalFindMany).not.toHaveBeenCalled();
  });

  it('returns entries for ADMIN', async () => {
    authMock.mockResolvedValue(adminA);
    signalFindMany.mockResolvedValueOnce([{ id: 's1' }]);
    const res = await SIGNALS_GET(
      makeGetReq('http://localhost/api/shoppermind/signals-of-the-day') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
  });
});

// ─── GET /api/shoppermind/sources ───────────────────────────────────

describe('GET /api/shoppermind/sources — admin gate', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await SOURCES_GET(
      makeGetReq('http://localhost/api/shoppermind/sources') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(sourceFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await SOURCES_GET(
      makeGetReq('http://localhost/api/shoppermind/sources') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(sourceFindMany).not.toHaveBeenCalled();
  });

  it('returns sources for ADMIN', async () => {
    authMock.mockResolvedValue(adminA);
    sourceFindMany.mockResolvedValueOnce([]);
    const res = await SOURCES_GET(
      makeGetReq('http://localhost/api/shoppermind/sources') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/shoppermind/sources ──────────────────────────────────

describe('POST /api/shoppermind/sources — admin gate', () => {
  it('returns 403 when not ADMIN', async () => {
    authMock.mockResolvedValue(nonAdmin);
    const res = await SOURCES_POST(
      makePostReq('http://localhost/api/shoppermind/sources', {
        name: 'Test',
        type: 'RSS',
        url: 'http://example.com',
        country: 'FI',
        language: 'fi',
      }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(sourceCreate).not.toHaveBeenCalled();
  });

  it('creates source for ADMIN', async () => {
    authMock.mockResolvedValue(adminA);
    sourceCreate.mockResolvedValueOnce({ id: 'src1' });
    const res = await SOURCES_POST(
      makePostReq('http://localhost/api/shoppermind/sources', {
        name: 'Test',
        type: 'RSS',
        url: 'http://example.com',
        country: 'FI',
        language: 'fi',
      }) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
    expect(sourceCreate).toHaveBeenCalled();
  });
});
