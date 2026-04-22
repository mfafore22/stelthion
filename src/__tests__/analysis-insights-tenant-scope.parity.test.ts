/**
 * @jest-environment node
 *
 * Phase D parity test — /api/analysis/insights/[jobId].
 *
 * Pre-Phase-D leaks:
 *   - GET was session-gated but did not validate job ownership — any
 *     authenticated user could read another tenant's stored insights
 *     by guessing the cuid.
 *   - POST was session-gated but did not validate job ownership — any
 *     authenticated user could trigger LLM generation against another
 *     tenant's job data, costing the wrong customer's compute and
 *     materializing their mall data into a new insight row that the
 *     attacker would then read via GET.
 *
 * After Phase D:
 *   - Both verbs are wrapped with defineHandler, require a session,
 *     and call requireJobOwnership which 404s if the job is missing
 *     and 403s if it belongs to another tenant.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    analysisJob: { findUnique: jest.fn() },
    analysisInsight: { findMany: jest.fn(), create: jest.fn() },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

import { GET, POST } from '@/app/api/analysis/insights/[jobId]/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const jobFindUnique = (prisma as any).analysisJob.findUnique as jest.Mock
const insightFindMany = (prisma as any).analysisInsight.findMany as jest.Mock
const insightCreate = (prisma as any).analysisInsight.create as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeGet(jobId: string): Request {
  return new Request(`http://localhost/api/analysis/insights/${jobId}`, {
    method: 'GET',
  })
}
function makePost(jobId: string): Request {
  return new Request(`http://localhost/api/analysis/insights/${jobId}`, {
    method: 'POST',
  })
}

function makeCtx(jobId: string) {
  return { params: Promise.resolve({ jobId }) }
}

beforeEach(() => {
  jobFindUnique.mockReset()
  insightFindMany.mockReset()
  insightCreate.mockReset()
  authMock.mockReset()
})

describe('GET /api/analysis/insights/[jobId] — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  )

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeGet('job-1') as any, makeCtx('job-1') as any)
    expect(res.status).toBe(401)
    expect(insightFindMany).not.toHaveBeenCalled()
  })

  it('returns 404 when the job does not exist', async () => {
    jobFindUnique.mockResolvedValueOnce(null)
    const res = await GET(makeGet('ghost') as any, makeCtx('ghost') as any)
    expect(res.status).toBe(404)
    expect(insightFindMany).not.toHaveBeenCalled()
  })

  it('returns 403 when the job belongs to another customer', async () => {
    jobFindUnique.mockResolvedValueOnce({
      mall: { customerId: 'cust-B' },
    })
    const res = await GET(makeGet('job-other') as any, makeCtx('job-other') as any)
    expect(res.status).toBe(403)
    expect(insightFindMany).not.toHaveBeenCalled()
  })

  it('returns insights when ownership check passes', async () => {
    jobFindUnique.mockResolvedValueOnce({ mall: { customerId: 'cust-A' } })
    insightFindMany.mockResolvedValue([
      { id: 'ins-1', summary: 'Looks good', createdAt: new Date() },
    ])
    const res = await GET(makeGet('job-A') as any, makeCtx('job-A') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.insights).toHaveLength(1)
  })
})

describe('POST /api/analysis/insights/[jobId] — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  )

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makePost('job-1') as any, makeCtx('job-1') as any)
    expect(res.status).toBe(401)
    expect(jobFindUnique).not.toHaveBeenCalled()
    expect(insightCreate).not.toHaveBeenCalled()
  })

  it('returns 404 when the job does not exist', async () => {
    jobFindUnique.mockResolvedValueOnce(null)
    const res = await POST(makePost('ghost') as any, makeCtx('ghost') as any)
    expect(res.status).toBe(404)
    // Crucially: no LLM call attempted, no insight row created against
    // a phantom job.
    expect(insightCreate).not.toHaveBeenCalled()
  })

  it('returns 403 when the job belongs to another customer', async () => {
    jobFindUnique.mockResolvedValueOnce({
      mall: { customerId: 'cust-B' },
    })
    const res = await POST(
      makePost('job-other') as any,
      makeCtx('job-other') as any,
    )
    expect(res.status).toBe(403)
    // Crucially: the cross-tenant LLM-cost-burn leak is closed.
    // No second findUnique (which would load the foreign mall's data),
    // no insight row created.
    expect(jobFindUnique).toHaveBeenCalledTimes(1)
    expect(insightCreate).not.toHaveBeenCalled()
  })

  it('falls back to numerical summary when ownership passes but the job is incomplete', async () => {
    jobFindUnique
      .mockResolvedValueOnce({ mall: { customerId: 'cust-A' } })
      .mockResolvedValueOnce({
        id: 'job-A',
        status: 'PENDING',
        mode: 'ZONE_COUNT',
        results: [],
        journeys: [],
        behaviors: [],
      })
    const res = await POST(makePost('job-A') as any, makeCtx('job-A') as any)
    // Ownership passes, but the route requires status === 'COMPLETE'.
    expect(res.status).toBe(400)
    expect(insightCreate).not.toHaveBeenCalled()
  })
})
