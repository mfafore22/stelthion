/**
 * @jest-environment node
 *
 * Phase B.5 tenant-scoping parity test — /api/admin/users.
 *
 * Pre-Phase-B.5 leak: GET returned every user across every customer,
 * POST honored a client-supplied customerId. After Phase B.5:
 *   - GET filters prisma.user.findMany by session.user.customerId
 *   - POST ignores body.customerId entirely; uses session.user.customerId
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    user: { findMany: jest.fn() },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

jest.mock('@/lib/email/sendOTP', () => ({
  createUserAndSendWelcome: jest.fn(),
  maskEmail: (s: string) => s,
}))

import { GET, POST } from '@/app/api/admin/users/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'
import { createUserAndSendWelcome } from '@/lib/email/sendOTP'

const userFindMany = (prisma as any).user.findMany as jest.Mock
const authMock = auth as unknown as jest.Mock
const createUserMock = createUserAndSendWelcome as unknown as jest.Mock

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
function makeGetReq(): Request {
  return new Request('http://localhost/api/admin/users', { method: 'GET' })
}

// Next.js 16 always passes a routeCtx with a Promise-resolved `params`,
// even for non-parameterized routes. The defineHandler wrapper awaits it.
const emptyCtx = () => ({ params: Promise.resolve({}) })

beforeEach(() => {
  userFindMany.mockReset()
  authMock.mockReset()
  createUserMock.mockReset()
})

describe('GET /api/admin/users — tenant scope', () => {
  it('filters findMany by session customerId', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
    userFindMany.mockResolvedValue([])

    await GET(makeGetReq() as any, emptyCtx() as any)

    expect(userFindMany).toHaveBeenCalledTimes(1)
    const args = userFindMany.mock.calls[0][0]
    expect(args.where).toEqual({ customerId: 'cust-A' })
  })

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeGetReq() as any, emptyCtx() as any)
    expect(res.status).toBe(401)
    expect(userFindMany).not.toHaveBeenCalled()
  })

  it('returns 403 when role is not ADMIN', async () => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    })
    const res = await GET(makeGetReq() as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(userFindMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/users — tenant scope', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
    })
    createUserMock.mockResolvedValue({ userId: 'new-u', password: 'pw' })
  })

  it('ignores client-supplied customerId and uses session customerId', async () => {
    await POST(
      makeReq({
        email: 'new@example.com',
        name: 'New',
        customerId: 'EVIL-cust-B', // attempt to provision into another tenant
        role: 'USER',
      }) as any,
      emptyCtx() as any,
    )

    expect(createUserMock).toHaveBeenCalledTimes(1)
    const args = createUserMock.mock.calls[0][0]
    // The session's customerId wins, not the body's.
    expect(args.customerId).toBe('cust-A')
    expect(args.customerId).not.toBe('EVIL-cust-B')
  })

  it('still creates the user when body has no customerId at all', async () => {
    const res = await POST(
      makeReq({ email: 'new@example.com', name: 'New', role: 'USER' }) as any,
      emptyCtx() as any,
    )
    expect(res.status).toBe(200)
    const args = createUserMock.mock.calls[0][0]
    expect(args.customerId).toBe('cust-A')
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeReq({ name: 'New' }) as any, emptyCtx() as any)
    expect(res.status).toBe(400)
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeReq({ email: 'a@b.com' }) as any, emptyCtx() as any)
    expect(res.status).toBe(400)
    expect(createUserMock).not.toHaveBeenCalled()
  })
})
