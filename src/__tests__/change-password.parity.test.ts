/**
 * @jest-environment node
 *
 * Phase A.5 parity test — POST /api/change-password.
 *
 * Contract:
 *   - 401 when no session
 *   - 400 when newPassword is missing, not a string, or shorter than 8 chars
 *   - 404 when user not found
 *   - First-time change (passwordChangedAt is null): skips currentPassword check
 *   - Subsequent change: requires correct currentPassword (403 if wrong, 400 if missing)
 *   - On success: writes hashed password + sets passwordChangedAt = now
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { POST } from '@/app/api/change-password/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const userFindUnique = (prisma as any).user.findUnique as jest.Mock
const userUpdate = (prisma as any).user.update as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  userFindUnique.mockReset()
  userUpdate.mockReset()
  authMock.mockReset()
})

describe('POST /api/change-password — guards', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeReq({ newPassword: 'longenough' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when newPassword is missing', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when newPassword is shorter than 8 chars', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeReq({ newPassword: '1234567' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when newPassword is not a string', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeReq({ newPassword: 12345678 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when user not found in DB', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    userFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ newPassword: 'newpass123' }))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/change-password — first-time change (forced)', () => {
  it('skips currentPassword check when passwordChangedAt is null', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const oldHash = await bcrypt.hash('whatever', 10)
    userFindUnique.mockResolvedValue({
      password: oldHash,
      passwordChangedAt: null,
    })

    const before = Date.now()
    // Note: no currentPassword in payload — must still succeed
    const res = await POST(makeReq({ newPassword: 'newpass123' }))
    const after = Date.now()

    expect(res.status).toBe(200)
    expect(userUpdate).toHaveBeenCalledTimes(1)
    const updateArgs = userUpdate.mock.calls[0][0]
    expect(updateArgs.where).toEqual({ id: 'u1' })
    expect(updateArgs.data.password).not.toBe('newpass123')
    expect(updateArgs.data.password).toMatch(/^\$2[aby]\$/) // bcrypt hash
    expect(await bcrypt.compare('newpass123', updateArgs.data.password)).toBe(true)
    const ts = (updateArgs.data.passwordChangedAt as Date).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})

describe('POST /api/change-password — subsequent change (current password required)', () => {
  it('returns 400 when currentPassword is missing on subsequent change', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const oldHash = await bcrypt.hash('correct-old', 10)
    userFindUnique.mockResolvedValue({
      password: oldHash,
      passwordChangedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
    const res = await POST(makeReq({ newPassword: 'newpass123' }))
    expect(res.status).toBe(400)
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('returns 403 when currentPassword is wrong', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const oldHash = await bcrypt.hash('correct-old', 10)
    userFindUnique.mockResolvedValue({
      password: oldHash,
      passwordChangedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
    const res = await POST(
      makeReq({ currentPassword: 'wrong-old', newPassword: 'newpass123' }),
    )
    expect(res.status).toBe(403)
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('succeeds when currentPassword matches and writes new hash + timestamp', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const oldHash = await bcrypt.hash('correct-old', 10)
    userFindUnique.mockResolvedValue({
      password: oldHash,
      passwordChangedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })

    const before = Date.now()
    const res = await POST(
      makeReq({ currentPassword: 'correct-old', newPassword: 'newpass123' }),
    )
    const after = Date.now()

    expect(res.status).toBe(200)
    expect(userUpdate).toHaveBeenCalledTimes(1)
    const updateArgs = userUpdate.mock.calls[0][0]
    expect(await bcrypt.compare('newpass123', updateArgs.data.password)).toBe(true)
    const ts = (updateArgs.data.passwordChangedAt as Date).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})

// ─── Snapshot guard on the route source — locks in the magic
// numbers and conditional branches the route relies on. ──────────

describe('src/app/api/change-password/route.ts — structural parity', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src', 'app', 'api', 'change-password', 'route.ts'),
    'utf8',
  )

  it('enforces minimum new password length of 8', () => {
    expect(src).toMatch(/newPassword\.length\s*<\s*8/)
  })

  it('detects first-time change via passwordChangedAt nullity', () => {
    expect(src).toMatch(/!user\.passwordChangedAt/)
  })

  it('uses bcrypt.compare for currentPassword verification', () => {
    expect(src).toMatch(/bcrypt\.compare\(currentPassword,\s*user\.password\)/)
  })

  it('writes passwordChangedAt: new Date() on success', () => {
    expect(src).toMatch(/passwordChangedAt:\s*new Date\(\)/)
  })
})
