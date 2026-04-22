/**
 * @jest-environment node
 *
 * Phase B.5 tenant-scoping parity test — /api/admin/jobs.
 *
 * Pre-Phase-B.5 leaks:
 *   - GET returned every analysis job across every customer.
 *   - PATCH updated any job by id without ownership check.
 *
 * After Phase B.5:
 *   - GET filters where: { mall: { customerId: <session> } }
 *   - PATCH looks up the job's mall and rejects with 403 on mismatch.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    analysisJob: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

import { GET, PATCH } from '@/app/api/admin/jobs/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const jobFindMany = (prisma as any).analysisJob.findMany as jest.Mock
const jobFindUnique = (prisma as any).analysisJob.findUnique as jest.Mock
const jobUpdate = (prisma as any).analysisJob.update as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeGetReq(): Request {
  return new Request('http://localhost/api/admin/jobs', { method: 'GET' })
}
function makePatchReq(body: unknown): Request {
  return new Request('http://localhost/api/admin/jobs', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// Next.js 16 always passes a routeCtx with a Promise-resolved `params`,
// even for non-parameterized routes. The defineHandler wrapper awaits it.
const emptyCtx = () => ({ params: Promise.resolve({}) })

beforeEach(() => {
  jobFindMany.mockReset()
  jobFindUnique.mockReset()
  jobUpdate.mockReset()
  authMock.mockReset()
})

describe('GET /api/admin/jobs — tenant scope', () => {
  it('filters findMany by mall.customerId of the session', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
    jobFindMany.mockResolvedValue([])

    await GET(makeGetReq() as any, emptyCtx() as any)

    expect(jobFindMany).toHaveBeenCalledTimes(1)
    const args = jobFindMany.mock.calls[0][0]
    expect(args.where).toEqual({ mall: { customerId: 'cust-A' } })
  })

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeGetReq() as any, emptyCtx() as any)
    expect(res.status).toBe(401)
    expect(jobFindMany).not.toHaveBeenCalled()
  })

  // Behaviour change in Phase D: the pre-Phase-D handler did its own
  // role check and returned 401 for an authenticated non-ADMIN. The
  // defineHandler `auth: 'admin'` mode delegates to requireAdmin which
  // returns 403 for that case (and 401 only for unauthenticated). All
  // other admin routes already used this convention; this test pins
  // the new normalized behaviour.
  it('returns 403 when authenticated user is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    })
    const res = await GET(makeGetReq() as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(jobFindMany).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/jobs — tenant scope', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
  })

  it('rejects with 403 when the job belongs to a different customer', async () => {
    jobFindUnique.mockResolvedValue({ mall: { customerId: 'cust-B' } })

    const res = await PATCH(makePatchReq({ id: 'job-1', status: 'COMPLETE' }) as any, emptyCtx() as any)

    expect(res.status).toBe(403)
    expect(jobUpdate).not.toHaveBeenCalled()
  })

  it('rejects with 404 when the job does not exist', async () => {
    jobFindUnique.mockResolvedValue(null)

    const res = await PATCH(makePatchReq({ id: 'job-x', status: 'COMPLETE' }) as any, emptyCtx() as any)

    expect(res.status).toBe(404)
    expect(jobUpdate).not.toHaveBeenCalled()
  })

  it('updates when the job belongs to the calling admin customer', async () => {
    jobFindUnique.mockResolvedValue({ mall: { customerId: 'cust-A' } })
    jobUpdate.mockResolvedValue({ id: 'job-1', status: 'COMPLETE' })

    const res = await PATCH(makePatchReq({ id: 'job-1', status: 'COMPLETE' }) as any, emptyCtx() as any)

    expect(res.status).toBe(200)
    expect(jobUpdate).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: 'COMPLETE' },
    })
  })

  it('returns 400 on invalid status', async () => {
    const res = await PATCH(makePatchReq({ id: 'job-1', status: 'BOGUS' }) as any, emptyCtx() as any)
    expect(res.status).toBe(400)
    expect(jobFindUnique).not.toHaveBeenCalled()
  })
})
