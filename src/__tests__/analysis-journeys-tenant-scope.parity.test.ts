/**
 * @jest-environment node
 *
 * Phase D parity test — /api/analysis/journeys/[jobId].
 *
 * Pre-Phase-D leak:
 *   - GET was session-gated but did not validate job ownership. Any
 *     authenticated user could read another tenant's journey paths
 *     (potentially containing PII / mall layout intel) by guessing
 *     the cuid.
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

import { GET } from '@/app/api/analysis/journeys/[jobId]/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const jobFindUnique = (prisma as any).analysisJob.findUnique as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeReq(jobId: string): Request {
  return new Request(`http://localhost/api/analysis/journeys/${jobId}`, {
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

describe('GET /api/analysis/journeys/[jobId] — tenant scope', () => {
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
    expect(jobFindUnique).toHaveBeenCalledTimes(1)
  })

  it('returns the journey payload when ownership check passes', async () => {
    jobFindUnique
      .mockResolvedValueOnce({ mall: { customerId: 'cust-A' } })
      .mockResolvedValueOnce({
        originZoneId: 'z-orig',
        destinationZoneId: 'z-dest',
        selectedZoneIds: '["z-1","z-2"]',
        mode: 'JOURNEY_MAP',
        journeys: [{ id: 'sess-1', paths: [] }],
      })

    const res = await GET(makeReq('job-A') as any, makeCtx('job-A') as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.originZoneId).toBe('z-orig')
    expect(body.destinationZoneId).toBe('z-dest')
    expect(body.selectedZoneIds).toEqual(['z-1', 'z-2'])
    expect(body.mode).toBe('JOURNEY_MAP')
    expect(body.sessions).toHaveLength(1)
  })
})
