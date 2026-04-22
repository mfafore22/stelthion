/**
 * @jest-environment node
 *
 * Phase D parity test — /api/admin/verification/* (2 routes).
 *
 * Pre-Phase-D leaks:
 *   - verification/[jobId] GET: admin-gated but no job ownership check.
 *     A tenant admin could read another customer's verification
 *     snapshots (image references, color signatures, anonymous tags)
 *     by jobId-guess.
 *   - verification/[jobId] POST: same leak shape — a tenant admin could
 *     write verdicts ("match"/"mismatch"/"unsure") onto another
 *     customer's verification job, polluting their re-ID training
 *     ground truth.
 *   - verification/training-pairs GET: admin-gated but the review query
 *     was UNSCOPED. A tenant admin could pull every other customer's
 *     labeled training pairs by hitting this endpoint, getting
 *     cross-customer ground-truth data they could feed into their own
 *     re-ID model. This is the most severe leak in the admin group —
 *     it intentionally surfaces labels the customer paid to produce.
 *
 * After Phase D:
 *   - verification/[jobId] GET + POST gated by requireJobOwnership.
 *   - verification/training-pairs queries verificationReview filtered by
 *     job.mall.customerId (and the per-review snapshot fetch is also
 *     scoped on job.mall.customerId for defense-in-depth).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    analysisJob: { findUnique: jest.fn() },
    verificationSnapshot: { findMany: jest.fn() },
    verificationReview: { findMany: jest.fn(), upsert: jest.fn() },
  },
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import { GET as JOB_GET, POST as JOB_POST } from '@/app/api/admin/verification/[jobId]/route';
import { GET as TRAINING_GET } from '@/app/api/admin/verification/training-pairs/route';
import prisma from '@/server/db/client';
import { auth } from '@/auth';

const jobFindUnique = (prisma as any).analysisJob.findUnique as jest.Mock;
const snapshotFindMany = (prisma as any).verificationSnapshot.findMany as jest.Mock;
const reviewFindMany = (prisma as any).verificationReview.findMany as jest.Mock;
const reviewUpsert = (prisma as any).verificationReview.upsert as jest.Mock;
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
const emptyCtx = () => ({ params: Promise.resolve({}) });

const adminA = {
  user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
};

beforeEach(() => {
  jobFindUnique.mockReset();
  snapshotFindMany.mockReset();
  reviewFindMany.mockReset();
  reviewUpsert.mockReset();
  authMock.mockReset();
});

describe('GET /api/admin/verification/[jobId] — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await JOB_GET(
      makeReq('http://localhost/api/admin/verification/job-1') as any,
      ctx({ jobId: 'job-1' }) as any,
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 when authenticated user is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    });
    const res = await JOB_GET(
      makeReq('http://localhost/api/admin/verification/job-1') as any,
      ctx({ jobId: 'job-1' }) as any,
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when the job does not exist', async () => {
    jobFindUnique.mockResolvedValueOnce(null);
    const res = await JOB_GET(
      makeReq('http://localhost/api/admin/verification/ghost') as any,
      ctx({ jobId: 'ghost' }) as any,
    );
    expect(res.status).toBe(404);
    expect(snapshotFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when the job belongs to another customer', async () => {
    jobFindUnique.mockResolvedValueOnce({
      mall: { customerId: 'cust-B' },
    });
    const res = await JOB_GET(
      makeReq('http://localhost/api/admin/verification/job-foreign') as any,
      ctx({ jobId: 'job-foreign' }) as any,
    );
    expect(res.status).toBe(403);
    expect(snapshotFindMany).not.toHaveBeenCalled();
    expect(reviewFindMany).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/verification/[jobId] — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('returns 403 when the job belongs to another customer (no verdict written)', async () => {
    jobFindUnique.mockResolvedValueOnce({
      mall: { customerId: 'cust-B' },
    });
    const res = await JOB_POST(
      makeReq('http://localhost/api/admin/verification/job-foreign', 'POST', {
        anonymousTagId: 'tag-1',
        verdict: 'match',
      }) as any,
      ctx({ jobId: 'job-foreign' }) as any,
    );
    expect(res.status).toBe(403);
    // The leak fix: no verdict gets written to a foreign tenant's job.
    expect(reviewUpsert).not.toHaveBeenCalled();
  });

  it('returns 404 when the job does not exist', async () => {
    jobFindUnique.mockResolvedValueOnce(null);
    const res = await JOB_POST(
      makeReq('http://localhost/api/admin/verification/ghost', 'POST', {
        anonymousTagId: 'tag-1',
        verdict: 'match',
      }) as any,
      ctx({ jobId: 'ghost' }) as any,
    );
    expect(res.status).toBe(404);
    expect(reviewUpsert).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid verdict', async () => {
    const res = await JOB_POST(
      makeReq('http://localhost/api/admin/verification/job-A', 'POST', {
        anonymousTagId: 'tag-1',
        verdict: 'bogus',
      }) as any,
      ctx({ jobId: 'job-A' }) as any,
    );
    expect(res.status).toBe(400);
    expect(jobFindUnique).not.toHaveBeenCalled();
  });

  it('upserts the verdict when ownership passes', async () => {
    jobFindUnique.mockResolvedValueOnce({ mall: { customerId: 'cust-A' } });
    reviewUpsert.mockResolvedValue({ id: 'rev-1' });
    const res = await JOB_POST(
      makeReq('http://localhost/api/admin/verification/job-A', 'POST', {
        anonymousTagId: 'tag-1',
        verdict: 'match',
      }) as any,
      ctx({ jobId: 'job-A' }) as any,
    );
    expect(res.status).toBe(200);
    expect(reviewUpsert).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/admin/verification/training-pairs — tenant scope', () => {
  beforeEach(() => authMock.mockResolvedValue(adminA));

  it('scopes the review query to the calling customer', async () => {
    reviewFindMany.mockResolvedValue([]);
    await TRAINING_GET(
      makeReq('http://localhost/api/admin/verification/training-pairs') as any,
      emptyCtx() as any,
    );
    expect(reviewFindMany).toHaveBeenCalledTimes(1);
    const args = reviewFindMany.mock.calls[0][0];
    // The leak fix: pre-Phase-D this where clause was
    //   { verdict: { in: ['match', 'mismatch'] } }
    // and a tenant admin got every other customer's training pairs.
    expect(args.where).toEqual({
      verdict: { in: ['match', 'mismatch'] },
      job: { mall: { customerId: 'cust-A' } },
    });
  });

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null);
    const res = await TRAINING_GET(
      makeReq('http://localhost/api/admin/verification/training-pairs') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(401);
    expect(reviewFindMany).not.toHaveBeenCalled();
  });

  it('returns 403 when authenticated user is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    });
    const res = await TRAINING_GET(
      makeReq('http://localhost/api/admin/verification/training-pairs') as any,
      emptyCtx() as any,
    );
    expect(res.status).toBe(403);
    expect(reviewFindMany).not.toHaveBeenCalled();
  });

  it('also scopes the per-review snapshot fetch to the calling customer', async () => {
    // Defense-in-depth: even if a malicious row somehow appeared, the
    // snapshot query is also gated on job.mall.customerId.
    reviewFindMany.mockResolvedValue([
      { jobId: 'job-A', anonymousTagId: 'tag-1', verdict: 'match' },
    ]);
    snapshotFindMany.mockResolvedValue([]);

    await TRAINING_GET(
      makeReq('http://localhost/api/admin/verification/training-pairs') as any,
      emptyCtx() as any,
    );

    expect(snapshotFindMany).toHaveBeenCalledTimes(1);
    const args = snapshotFindMany.mock.calls[0][0];
    expect(args.where).toMatchObject({
      jobId: 'job-A',
      anonymousTagId: 'tag-1',
      job: { mall: { customerId: 'cust-A' } },
    });
  });
});
