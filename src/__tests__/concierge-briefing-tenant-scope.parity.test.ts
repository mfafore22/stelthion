/**
 * @jest-environment node
 *
 * Phase B.5 tenant-scoping parity test — /api/concierge/briefing.
 *
 * Pre-Phase-B.5 leak: GET and POST trusted client-supplied mallId,
 * allowing a tenant user to read or generate a briefing against another
 * tenant's mall.
 *
 * After Phase B.5: assertMallBelongsToSession runs before any briefing
 * read or generate. Returns 404 if mallId is unknown, 403 if it
 * belongs to a different customer.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    mall: { findUnique: jest.fn() },
    conciergeBriefing: { findUnique: jest.fn(), upsert: jest.fn() },
    conciergeBriefingSubscription: { findUnique: jest.fn() },
  },
}))

jest.mock('@/auth', () => ({ auth: jest.fn() }))

jest.mock('@/services/concierge/briefing-generator', () => ({
  generateBriefing: jest.fn(),
}))

import { GET, POST } from '@/app/api/concierge/briefing/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'
import { generateBriefing } from '@/services/concierge/briefing-generator'

const mallFindUnique = (prisma as any).mall.findUnique as jest.Mock
const briefingFindUnique = (prisma as any).conciergeBriefing.findUnique as jest.Mock
const briefingUpsert = (prisma as any).conciergeBriefing.upsert as jest.Mock
const subFindUnique = (prisma as any).conciergeBriefingSubscription.findUnique as jest.Mock
const authMock = auth as unknown as jest.Mock
const generateBriefingMock = generateBriefing as unknown as jest.Mock

function makeGet(query = ''): Request {
  return new Request(`http://localhost/api/concierge/briefing${query}`, { method: 'GET' })
}
function makePost(body: unknown): Request {
  return new Request('http://localhost/api/concierge/briefing', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
const emptyCtx = () => ({ params: Promise.resolve({}) })

beforeEach(() => {
  mallFindUnique.mockReset()
  briefingFindUnique.mockReset()
  briefingUpsert.mockReset()
  subFindUnique.mockReset()
  authMock.mockReset()
  generateBriefingMock.mockReset()
})

describe('GET /api/concierge/briefing — tenant scope', () => {
  beforeEach(() =>
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    }),
  )

  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(makeGet('?mallId=mall-A1') as any, emptyCtx() as any)
    expect(res.status).toBe(401)
    expect(briefingFindUnique).not.toHaveBeenCalled()
  })

  it('returns 400 when mallId query param is missing', async () => {
    const res = await GET(makeGet('') as any, emptyCtx() as any)
    expect(res.status).toBe(400)
    expect(briefingFindUnique).not.toHaveBeenCalled()
  })

  it('rejects with 403 when mallId belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' })
    const res = await GET(makeGet('?mallId=mall-B1') as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(briefingFindUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when mallId is unknown', async () => {
    mallFindUnique.mockResolvedValue(null)
    const res = await GET(makeGet('?mallId=ghost') as any, emptyCtx() as any)
    expect(res.status).toBe(404)
    expect(briefingFindUnique).not.toHaveBeenCalled()
  })

  it('reads the briefing when ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' })
    briefingFindUnique.mockResolvedValue({ id: 'b1', mallId: 'mall-A1' })
    const res = await GET(makeGet('?mallId=mall-A1') as any, emptyCtx() as any)
    expect(res.status).toBe(200)
    expect(briefingFindUnique).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/concierge/briefing — tenant scope', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'u1', role: 'USER', customerId: 'cust-A' },
    })
    generateBriefingMock.mockResolvedValue({ greeting: 'hi' })
    subFindUnique.mockResolvedValue(null)
  })

  it('rejects with 403 when mallId belongs to a different customer', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-B' })
    const res = await POST(makePost({ mallId: 'mall-B1' }) as any, emptyCtx() as any)
    expect(res.status).toBe(403)
    expect(generateBriefingMock).not.toHaveBeenCalled()
    expect(briefingUpsert).not.toHaveBeenCalled()
  })

  it('returns 404 when mallId is unknown', async () => {
    mallFindUnique.mockResolvedValue(null)
    const res = await POST(makePost({ mallId: 'ghost' }) as any, emptyCtx() as any)
    expect(res.status).toBe(404)
    expect(generateBriefingMock).not.toHaveBeenCalled()
  })

  it('returns 400 when mallId is missing', async () => {
    const res = await POST(makePost({}) as any, emptyCtx() as any)
    expect(res.status).toBe(400)
    expect(mallFindUnique).not.toHaveBeenCalled()
  })

  it('generates and upserts the briefing when ownership check passes', async () => {
    mallFindUnique.mockResolvedValue({ customerId: 'cust-A' })
    briefingUpsert.mockResolvedValue({ id: 'b1', mallId: 'mall-A1' })

    const res = await POST(makePost({ mallId: 'mall-A1' }) as any, emptyCtx() as any)

    expect(res.status).toBe(201)
    expect(generateBriefingMock).toHaveBeenCalledWith('mall-A1', expect.any(Array))
    expect(briefingUpsert).toHaveBeenCalledTimes(1)
  })
})
