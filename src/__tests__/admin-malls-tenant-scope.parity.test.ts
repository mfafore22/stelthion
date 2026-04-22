/**
 * @jest-environment node
 *
 * Phase B.5 tenant-scoping parity test — /api/admin/malls.
 *
 * Pre-Phase-B.5 leak: GET returned every mall across every customer.
 * After Phase B.5: prisma.mall.findMany filtered by session customerId.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findMany: jest.fn() },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

import { GET } from '@/app/api/admin/malls/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const mallFindMany = (prisma as any).mall.findMany as jest.Mock
const authMock = auth as unknown as jest.Mock

// Next.js 16 always passes a routeCtx with a Promise-resolved `params`,
// even for non-parameterized routes (where it resolves to `{}`). The
// defineHandler wrapper awaits routeCtx.params, so the test must supply
// it — production never invokes a route handler without it.
const emptyCtx = () => ({ params: Promise.resolve({}) })
const emptyReq = () =>
  new Request('http://localhost/api/admin/malls', { method: 'GET' })

beforeEach(() => {
  mallFindMany.mockReset()
  authMock.mockReset()
})

describe('GET /api/admin/malls — tenant scope', () => {
  it('filters findMany by session customerId', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
    mallFindMany.mockResolvedValue([])

    await GET(emptyReq() as any, emptyCtx() as any)

    expect(mallFindMany).toHaveBeenCalledTimes(1)
    const args = mallFindMany.mock.calls[0][0]
    expect(args.where).toEqual({ customerId: 'cust-A' })
  })

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(emptyReq() as any, emptyCtx() as any)
    expect(res.status).toBe(401)
    expect(mallFindMany).not.toHaveBeenCalled()
  })

  it('returns 403 when role is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    })
    const res = await GET(emptyReq() as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(mallFindMany).not.toHaveBeenCalled()
  })

  it('passes through whatever findMany returns as JSON', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
    mallFindMany.mockResolvedValue([
      { mallId: 'mall-A1', name: 'Acme A', city: 'Helsinki', status: 'LIVE' },
    ])
    const res = await GET(emptyReq() as any, emptyCtx() as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      { mallId: 'mall-A1', name: 'Acme A', city: 'Helsinki', status: 'LIVE' },
    ])
  })
})
