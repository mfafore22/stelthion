/**
 * @jest-environment node
 *
 * Phase D parity test — /api/analysis/results/[jobId].
 *
 * Pre-Phase-D leak:
 *   - GET was session-gated but did not validate job ownership. Any
 *     authenticated user could read another tenant's analysis results
 *     by guessing the cuid.
 *
 * After Phase D:
 *   - GET is wrapped with defineHandler, requires a session, and calls
 *     requireJobOwnership which 404s if the job is missing and 403s if
 *     it belongs to another tenant.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    analysisJob: { findUnique: jest.fn() },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

import { GET } from '@/app/api/analysis/results/[jobId]/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const jobFindUnique = (prisma as any).analysisJob.findUnique as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeReq(jobId: string): Request {
  return new Request(`http://localhost/api/analysis/results/${jobId}`, {
    method: 'GET',
  })
}

function makeCtx(jobId: string) {
  return { params: Promise.resolve({ jobId }) }
}

beforeEach(() => {
  jobFindUnique.mockReset()
  authMock.mockReset()
})

describe('GET /api/analysis/results/[jobId] — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  )

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeReq('job-1') as any, makeCtx('job-1') as any)
    expect(res.status).toBe(401)
    expect(jobFindUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when the job does not exist', async () => {
    // requireJobOwnership's lookup misses; the handler's own findUnique
    // is never reached.
    jobFindUnique.mockResolvedValueOnce(null)
    const res = await GET(makeReq('ghost') as any, makeCtx('ghost') as any)
    expect(res.status).toBe(404)
  })

  it('returns 403 when the job belongs to another customer', async () => {
    jobFindUnique.mockResolvedValueOnce({
      mall: { customerId: 'cust-B' },
    })
    const res = await GET(makeReq('job-other') as any, makeCtx('job-other') as any)
    expect(res.status).toBe(403)
    // The handler's data-fetch findUnique is never reached.
    expect(jobFindUnique).toHaveBeenCalledTimes(1)
  })

  it('returns the job when ownership check passes', async () => {
    // First call: requireJobOwnership lookup. Second call: handler's
    // own findUnique.
    jobFindUnique
      .mockResolvedValueOnce({ mall: { customerId: 'cust-A' } })
      .mockResolvedValueOnce({
        id: 'job-A',
        mode: 'ZONE_COUNT',
        camera: { label: 'C1', floor: 1 },
        secondaryCamera: null,
        results: [],
      })

    const res = await GET(makeReq('job-A') as any, makeCtx('job-A') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('job-A')
    expect(jobFindUnique).toHaveBeenCalledTimes(2)
  })
})
