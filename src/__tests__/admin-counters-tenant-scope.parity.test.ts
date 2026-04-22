/**
 * @jest-environment node
 *
 * Phase D parity test — /api/admin/counters/* (2 routes).
 *
 * Pre-Phase-D leaks:
 *   - counters/upload POST: admin-gated but accepted any client-supplied
 *     mallId in the multipart form without checking customer ownership.
 *     A tenant admin could inject counter data into another customer's
 *     mall by passing the foreign mallId — and because the route does
 *     a destructive `counterReading.deleteMany` BEFORE the upsert (to
 *     replace the affected weeks), a cross-tenant upload would also
 *     wipe out the rightful owner's existing data for those weeks.
 *
 *   - counters/weeks GET: defaulted mallId to the literal string
 *     'ideapark' when the query param was missing. A tenant admin
 *     could see Ideapark's uploads with no params, and could pass any
 *     other tenant's mallId to read their data. No ownership check.
 *
 *   - counters/weeks DELETE: accepted client-supplied uploadId with
 *     NO ownership check and no mallId binding — a tenant admin could
 *     delete any other tenant's counter readings (destructive,
 *     irreversible).
 *
 * After Phase D:
 *   - counters/upload requires mallId and runs requireMallOwnership
 *     BEFORE any workbook parsing or destructive DB write.
 *   - counters/weeks requires mallId on both verbs (no fallback default)
 *     and runs requireMallOwnership before any DB read or write.
 *   - counters/weeks DELETE-by-uploadId additionally re-validates that
 *     upload.mallId matches the (now-owned) URL mallId — closes the
 *     CSRF-shaped attack where an attacker wraps a foreign uploadId
 *     in their own mallId.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn() },
    counterUpload: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    counterReading: {
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import { POST as UPLOAD_POST } from '@/app/api/admin/counters/upload/route';
import {
  GET as WEEKS_GET,
  DELETE as WEEKS_DELETE,
} from '@/app/api/admin/counters/weeks/route';
import prisma from '@/server/db/client';
import { auth } from '@/auth';

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock;
const uploadFindMany = (prisma as any).counterUpload.findMany as jest.Mock;
const uploadFindUnique = (prisma as any).counterUpload.findUnique as jest.Mock;
const uploadDelete = (prisma as any).counterUpload.delete as jest.Mock;
const readingGroupBy = (prisma as any).counterReading.groupBy as jest.Mock;
const readingDeleteMany = (prisma as any).counterReading.deleteMany as jest.Mock;
const authMock = auth as unknown as jest.Mock;

const adminA = {
  user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
};

function makeGetReq(url: string): Request {
  return new Request(url, { method: 'GET' });
}
function makeDeleteReq(url: string): Request {
  return new Request(url, { method: 'DELETE' });
}
function makeUploadReq(url: string, fields: Record<string, string | File>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v as any);
  return new Request(url, { method: 'POST', body: fd });
}
const emptyCtx = () => ({ params: Promise.resolve({}) });

beforeEach(() => {
  mallFindUnique.mockReset();
  uploadFindMany.mockReset();
  uploadFindUnique.mockReset();
  uploadDelete.mockReset();
  readingGroupBy.mockReset();
  readingDeleteMany.mockReset();
  authMock.mockReset();
});

// ─── POST /api/admin/counters/upload ────────────────────────────────

describe('POST /api/admin/counters/upload — tenant scope', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await UPLOAD_POST(
      new Request('http://localhost/api/admin/counters/upload', { method: 'POST' }) as any,
    );
    expect(res.status).toBe(401);
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });

  it('returns 403 when authenticated user is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    });
    const res = await UPLOAD_POST(
      new Request('http://localhost/api/admin/counters/upload', { method: 'POST' }) as any,
    );
    expect(res.status).toBe(403);
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });

  it('returns 400 when file or mallId is missing', async () => {
    authMock.mockResolvedValue(adminA);
    const res = await UPLOAD_POST(
      makeUploadReq('http://localhost/api/admin/counters/upload', {}) as any,
    );
    expect(res.status).toBe(400);
    expect(mallFindUnique).not.toHaveBeenCalled();
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });

  it('returns 404 when the mall does not exist (no destructive delete fired)', async () => {
    authMock.mockResolvedValue(adminA);
    mallFindUnique.mockResolvedValueOnce(null);
    const res = await UPLOAD_POST(
      makeUploadReq('http://localhost/api/admin/counters/upload', {
        mallId: 'ghost',
        file: new File(['x'], 'x.xlsx'),
      }) as any,
    );
    expect(res.status).toBe(404);
    // The leak fix: no deleteMany before ownership passes.
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });

  it('returns 403 when the mall belongs to another customer (no destructive delete fired)', async () => {
    authMock.mockResolvedValue(adminA);
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await UPLOAD_POST(
      makeUploadReq('http://localhost/api/admin/counters/upload', {
        mallId: 'mall-foreign',
        file: new File(['x'], 'x.xlsx'),
      }) as any,
    );
    expect(res.status).toBe(403);
    // The most severe leak fix: a cross-tenant upload would otherwise
    // wipe out the rightful owner's data via deleteMany before upsert.
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });
});

// ─── GET /api/admin/counters/weeks ──────────────────────────────────

describe('GET /api/admin/counters/weeks — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await WEEKS_GET(
      makeGetReq('http://localhost/api/admin/counters/weeks?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(uploadFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when authenticated user is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    });
    const res = await WEEKS_GET(
      makeGetReq('http://localhost/api/admin/counters/weeks?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(uploadFindMany).not.toHaveBeenCalled();
  });

  it('returns 400 when mallId is missing (the ?? "ideapark" leak fix)', async () => {
    const res = await WEEKS_GET(
      makeGetReq('http://localhost/api/admin/counters/weeks') as any,
      emptyCtx() as any,
    );
    // Pre-Phase-D this would silently default to mallId='ideapark'
    // and return Ideapark's uploads to any tenant admin.
    expect(res.status).toBe(400);
    expect(mallFindUnique).not.toHaveBeenCalled();
    expect(uploadFindMany).not.toHaveBeenCalled();
  });

  it('returns 404 when the mall does not exist', async () => {
    mallFindUnique.mockResolvedValueOnce(null);
    const res = await WEEKS_GET(
      makeGetReq('http://localhost/api/admin/counters/weeks?mallId=ghost') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(404);
    expect(uploadFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when the mall belongs to another customer (no findMany fired)', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await WEEKS_GET(
      makeGetReq('http://localhost/api/admin/counters/weeks?mallId=mall-foreign') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(uploadFindMany).not.toHaveBeenCalled();
    expect(readingGroupBy).not.toHaveBeenCalled();
  });

  it('returns uploads when ownership passes', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    uploadFindMany.mockResolvedValueOnce([]);
    readingGroupBy.mockResolvedValueOnce([]);
    const res = await WEEKS_GET(
      makeGetReq('http://localhost/api/admin/counters/weeks?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
    expect(uploadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mallId: 'mall-A' } }),
    );
  });
});

// ─── DELETE /api/admin/counters/weeks ───────────────────────────────

describe('DELETE /api/admin/counters/weeks — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 400 when mallId is missing', async () => {
    const res = await WEEKS_DELETE(
      makeDeleteReq('http://localhost/api/admin/counters/weeks?uploadId=u1') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(400);
    expect(mallFindUnique).not.toHaveBeenCalled();
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it('returns 403 when the mall belongs to another customer (no destructive delete fired)', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-B' });
    const res = await WEEKS_DELETE(
      makeDeleteReq(
        'http://localhost/api/admin/counters/weeks?mallId=mall-foreign&uploadId=u1',
      ) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(uploadFindUnique).not.toHaveBeenCalled();
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it('returns 404 when uploadId does not exist after ownership passes', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    uploadFindUnique.mockResolvedValueOnce(null);
    const res = await WEEKS_DELETE(
      makeDeleteReq(
        'http://localhost/api/admin/counters/weeks?mallId=mall-A&uploadId=ghost',
      ) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(404);
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it('returns 403 when uploadId belongs to a different mall (CSRF-shape attack)', async () => {
    // Defense-in-depth: the URL's mallId IS owned by the caller, but the
    // attacker is trying to wrap a foreign uploadId in it. The route
    // re-validates that upload.mallId matches the URL mallId.
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    uploadFindUnique.mockResolvedValueOnce({ mallId: 'mall-other' });
    const res = await WEEKS_DELETE(
      makeDeleteReq(
        'http://localhost/api/admin/counters/weeks?mallId=mall-A&uploadId=foreign-upload',
      ) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it('happy path: deletes by uploadId when ownership and mall-binding pass', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    uploadFindUnique.mockResolvedValueOnce({ mallId: 'mall-A' });
    readingDeleteMany.mockResolvedValueOnce({ count: 7 });
    uploadDelete.mockResolvedValueOnce({});
    const res = await WEEKS_DELETE(
      makeDeleteReq(
        'http://localhost/api/admin/counters/weeks?mallId=mall-A&uploadId=u1',
      ) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
    expect(readingDeleteMany).toHaveBeenCalledWith({ where: { uploadId: 'u1' } });
    expect(uploadDelete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('happy path: legacy delete by week+year is scoped to the owned mallId', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    readingDeleteMany.mockResolvedValueOnce({ count: 4 });
    const res = await WEEKS_DELETE(
      makeDeleteReq(
        'http://localhost/api/admin/counters/weeks?mallId=mall-A&week=12&year=2026',
      ) as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(200);
    expect(readingDeleteMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A', weekNumber: 12, year: 2026, uploadId: null },
    });
  });

  it('returns 400 when neither uploadId nor week+year are provided', async () => {
    mallFindUnique.mockResolvedValueOnce({ customerId: 'cust-A' });
    const res = await WEEKS_DELETE(
      makeDeleteReq('http://localhost/api/admin/counters/weeks?mallId=mall-A') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(400);
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });
});
