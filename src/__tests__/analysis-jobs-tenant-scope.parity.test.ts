/**
 * @jest-environment node
 *
 * Phase B.5 tenant-scoping parity test — /api/analysis/jobs.
 *
 * Pre-Phase-B.5 leaks:
 *   - GET trusted client-supplied mallId; with no mallId, returned all
 *     jobs across all customers.
 *   - POST trusted client-supplied mallId, allowing job creation against
 *     another tenant's mall.
 *
 * After Phase B.5:
 *   - GET with mallId: validates ownership, 403 on mismatch.
 *   - GET without mallId: where: { mall: { customerId: <session> } }
 *   - POST: validates mallId ownership before creating, 403 on mismatch.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn() },
    analysisJob: { findMany: jest.fn(), create: jest.fn() },
    camera: { findUnique: jest.fn() },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

import { GET, POST } from '@/app/api/analysis/jobs/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock
const jobFindMany = (prisma as any).analysisJob.findMany as jest.Mock
const jobCreate = (prisma as any).analysisJob.create as jest.Mock
const cameraFindUnique = (prisma as any).camera.findUnique as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeGet(query = ''): Request {
  return new Request(`http://localhost/api/analysis/jobs${query}`, { method: 'GET' })
}
function makePost(body: unknown): Request {
  return new Request('http://localhost/api/analysis/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Next.js 16 always passes a routeCtx with a Promise-resolved `params`,
// even for non-parameterized routes (where it resolves to `{}`). The
// defineHandler wrapper awaits routeCtx.params, so the test must supply
// it — production never invokes a route handler without it.
const emptyCtx = () => ({ params: Promise.resolve({}) })

beforeEach(() => {
  mallFindUnique.mockReset()
  jobFindMany.mockReset()
  jobCreate.mockReset()
  cameraFindUnique.mockReset()
  authMock.mockReset()
})

describe('GET /api/analysis/jobs — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  )

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeGet('?mallId=mall-A1') as any, emptyCtx() as any)
    expect(res.status).toBe(401)
    expect(jobFindMany).not.toHaveBeenCalled()
  })

  it('rejects with 403 when supplied mallId belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' })
    const res = await GET(makeGet('?mallId=mall-B1') as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(jobFindMany).not.toHaveBeenCalled()
  })

  it('returns 404 when supplied mallId is unknown', async () => {
    mallFindUnique.mockResolvedValue(null)
    const res = await GET(makeGet('?mallId=ghost') as any, emptyCtx() as any)
    expect(res.status).toBe(404)
    expect(jobFindMany).not.toHaveBeenCalled()
  })

  it('queries with mallId filter when ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' })
    jobFindMany.mockResolvedValue([])
    await GET(makeGet('?mallId=mall-A1') as any, emptyCtx() as any)
    expect(jobFindMany).toHaveBeenCalledTimes(1)
    expect(jobFindMany.mock.calls[0][0].where).toMatchObject({ mallId: 'mall-A1' })
  })

  it('falls back to mall.customerId filter when no mallId is supplied', async () => {
    jobFindMany.mockResolvedValue([])
    await GET(makeGet('') as any, emptyCtx() as any)
    expect(jobFindMany).toHaveBeenCalledTimes(1)
    expect(jobFindMany.mock.calls[0][0].where).toEqual({
      mall: { customerId: 'cust-A' },
    })
    // No ownership check needed because we're not honoring an external mallId.
    expect(mallFindUnique).not.toHaveBeenCalled()
  })
})

describe('POST /api/analysis/jobs — tenant scope', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    })
    // Phase E — analysis/jobs now validates camera ownership through
    // floorplanRepo.assertCameraOwnedByMall, which selects
    // { mallId, mall: { customerId } } and requires the camera's mall
    // belongs to the caller's customer AND matches the body's mallId.
    cameraFindUnique.mockResolvedValue({
      mallId: 'mall-A1',
      mall: { customerId: 'cust-A' },
    })
  })

  const validBody = {
    mallId: 'mall-A1',
    mode: 'ZONE_COUNT',
    cameraId: 'cam-1',
    footageDate: '2026-04-22',
    startTime: '09:00',
    endTime: '10:00',
    requestedBy: 'u1',
  }

  it('rejects with 403 when mallId belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' })
    const res = await POST(makePost(validBody) as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(jobCreate).not.toHaveBeenCalled()
  })

  it('rejects with 404 when mallId is unknown', async () => {
    mallFindUnique.mockResolvedValue(null)
    const res = await POST(makePost(validBody) as any, emptyCtx() as any)
    expect(res.status).toBe(404)
    expect(jobCreate).not.toHaveBeenCalled()
  })

  it('creates the job when mall ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' })
    jobCreate.mockResolvedValue({ id: 'job-new' })
    const res = await POST(makePost(validBody) as any, emptyCtx() as any)
    expect(res.status).toBe(201)
    expect(jobCreate).toHaveBeenCalledTimes(1)
    expect(jobCreate.mock.calls[0][0].data.mallId).toBe('mall-A1')
  })

  it('returns 400 when mallId is missing', async () => {
    const { mallId: _omit, ...without } = validBody
    void _omit
    const res = await POST(makePost(without) as any, emptyCtx() as any)
    expect(res.status).toBe(400)
    expect(mallFindUnique).not.toHaveBeenCalled()
    expect(jobCreate).not.toHaveBeenCalled()
  })
})
