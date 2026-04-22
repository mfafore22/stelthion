/**
 * @jest-environment node
 *
 * Phase B.5 tenant-scoping parity test — /api/admin/edge/devices.
 *
 * Pre-Phase-B.5 leaks:
 *   - GET returned every device across every customer.
 *   - PATCH updated any device by id without ownership check.
 *   - DELETE removed any device by id without ownership check.
 *
 * After Phase B.5:
 *   - GET filters where: { mall: { customerId: <session> } }
 *   - PATCH and DELETE look up the device's mall and reject 403 on mismatch.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    edgeDevice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

import { GET, PATCH, DELETE } from '@/app/api/admin/edge/devices/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const findMany = (prisma as any).edgeDevice.findMany as jest.Mock
const findUnique = (prisma as any).edgeDevice.findUnique as jest.Mock
const update = (prisma as any).edgeDevice.update as jest.Mock
const remove = (prisma as any).edgeDevice.delete as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeReq(method: string, body: unknown): Request {
  return new Request('http://localhost/api/admin/edge/devices', {
    method,
    body: JSON.stringify(body),
  })
}
function makeGetReq(): Request {
  return new Request('http://localhost/api/admin/edge/devices', { method: 'GET' })
}

// Next.js 16 always passes a routeCtx with a Promise-resolved `params`,
// even for non-parameterized routes. The defineHandler wrapper awaits it.
const emptyCtx = () => ({ params: Promise.resolve({}) })

beforeEach(() => {
  findMany.mockReset()
  findUnique.mockReset()
  update.mockReset()
  remove.mockReset()
  authMock.mockReset()
})

describe('GET /api/admin/edge/devices — tenant scope', () => {
  it('filters findMany by mall.customerId of the session', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
    findMany.mockResolvedValue([])

    await GET(makeGetReq() as any, emptyCtx() as any)

    expect(findMany).toHaveBeenCalledTimes(1)
    const args = findMany.mock.calls[0][0]
    expect(args.where).toEqual({ mall: { customerId: 'cust-A' } })
  })

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeGetReq() as any, emptyCtx() as any)
    expect(res.status).toBe(401)
    expect(findMany).not.toHaveBeenCalled()
  })

  it('returns 403 when role is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    })
    const res = await GET(makeGetReq() as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(findMany).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/edge/devices — tenant scope', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
  })

  it('rejects with 403 when the device belongs to a different customer', async () => {
    findUnique.mockResolvedValue({ mall: { customerId: 'cust-B' } })

    const res = await PATCH(makeReq('PATCH', { id: 'd1', status: 'OFFLINE' }) as any, emptyCtx() as any)

    expect(res.status).toBe(403)
    expect(update).not.toHaveBeenCalled()
  })

  it('rejects with 404 when the device does not exist', async () => {
    findUnique.mockResolvedValue(null)
    const res = await PATCH(makeReq('PATCH', { id: 'd-x', status: 'OFFLINE' }) as any, emptyCtx() as any)
    expect(res.status).toBe(404)
    expect(update).not.toHaveBeenCalled()
  })

  it('updates when the device belongs to the calling admin customer', async () => {
    findUnique.mockResolvedValue({ mall: { customerId: 'cust-A' } })
    update.mockResolvedValue({ id: 'd1', status: 'OFFLINE' })

    const res = await PATCH(makeReq('PATCH', { id: 'd1', status: 'OFFLINE' }) as any, emptyCtx() as any)

    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { status: 'OFFLINE' },
    })
  })
})

describe('DELETE /api/admin/edge/devices — tenant scope', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
  })

  it('rejects with 403 when the device belongs to a different customer', async () => {
    findUnique.mockResolvedValue({ mall: { customerId: 'cust-B' } })

    const res = await DELETE(makeReq('DELETE', { id: 'd1' }) as any, emptyCtx() as any)

    expect(res.status).toBe(403)
    expect(remove).not.toHaveBeenCalled()
  })

  it('rejects with 404 when the device does not exist', async () => {
    findUnique.mockResolvedValue(null)
    const res = await DELETE(makeReq('DELETE', { id: 'd-x' }) as any, emptyCtx() as any)
    expect(res.status).toBe(404)
    expect(remove).not.toHaveBeenCalled()
  })

  it('deletes when the device belongs to the calling admin customer', async () => {
    findUnique.mockResolvedValue({ mall: { customerId: 'cust-A' } })
    remove.mockResolvedValue({})

    const res = await DELETE(makeReq('DELETE', { id: 'd1' }) as any, emptyCtx() as any)

    expect(res.status).toBe(200)
    expect(remove).toHaveBeenCalledWith({ where: { id: 'd1' } })
  })
})
