/**
 * @jest-environment node
 *
 * Phase A.5 parity test — locks in the OTP rate-limit and lockout
 * behavior of POST /api/two-factor/verify.
 *
 * The contract:
 *   - 401 when no session
 *   - 400 when no code provided
 *   - 429 when otpLockedUntil is in the future
 *   - 1st wrong code → 400 with "1 attempt remaining"
 *   - 2nd wrong code → 429, otpLockedUntil set to now+10 min, attempts reset
 *   - correct code → marks OTP used, sets twoFactorVerifiedAt=now,
 *     resets failedOtpAttempts, clears otpLockedUntil
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailOtp: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { POST } from '@/app/api/two-factor/verify/route'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const userFindUnique = (prisma as any).user.findUnique as jest.Mock
const userUpdate = (prisma as any).user.update as jest.Mock
const otpFindFirst = (prisma as any).emailOtp.findFirst as jest.Mock
const otpUpdate = (prisma as any).emailOtp.update as jest.Mock
const authMock = auth as unknown as jest.Mock

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/two-factor/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  userFindUnique.mockReset()
  userUpdate.mockReset()
  otpFindFirst.mockReset()
  otpUpdate.mockReset()
  authMock.mockReset()
})

describe('POST /api/two-factor/verify — guards', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeReq({ code: '123456' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when code is missing', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when code is not a string', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeReq({ code: 123456 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when user is not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    userFindUnique.mockResolvedValue(null)
    const res = await POST(makeReq({ code: '123456' }))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/two-factor/verify — OTP rate limit', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
  })

  it('returns 429 while otpLockedUntil is in the future', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      failedOtpAttempts: 0,
      otpLockedUntil: new Date(Date.now() + 5 * 60 * 1000),
    })
    const res = await POST(makeReq({ code: '123456' }))
    expect(res.status).toBe(429)
    expect(otpFindFirst).not.toHaveBeenCalled()
  })

  it('1st wrong code → increments failedOtpAttempts to 1, returns 400', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      failedOtpAttempts: 0,
      otpLockedUntil: null,
    })
    otpFindFirst.mockResolvedValue(null)
    const res = await POST(makeReq({ code: 'wrong1' }))
    expect(res.status).toBe(400)
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { failedOtpAttempts: 1 },
    })
  })

  it('2nd wrong code → locks for 10 min, resets attempts, returns 429', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      failedOtpAttempts: 1, // already had one prior wrong attempt
      otpLockedUntil: null,
    })
    otpFindFirst.mockResolvedValue(null)

    const before = Date.now()
    const res = await POST(makeReq({ code: 'wrong2' }))
    const after = Date.now()

    expect(res.status).toBe(429)
    expect(userUpdate).toHaveBeenCalledTimes(1)
    const updateArgs = userUpdate.mock.calls[0][0]
    expect(updateArgs.where).toEqual({ id: 'u1' })
    expect(updateArgs.data.failedOtpAttempts).toBe(0)
    const lockTs = (updateArgs.data.otpLockedUntil as Date).getTime()
    expect(lockTs).toBeGreaterThanOrEqual(before + 10 * 60 * 1000)
    expect(lockTs).toBeLessThanOrEqual(after + 10 * 60 * 1000)
  })
})

describe('POST /api/two-factor/verify — success path', () => {
  it('correct OTP marks it used, sets twoFactorVerifiedAt=now, clears lock', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      failedOtpAttempts: 1,
      otpLockedUntil: null,
    })
    otpFindFirst.mockResolvedValue({ id: 'otp-1', code: '654321' })

    const before = Date.now()
    const res = await POST(makeReq({ code: '654321' }))
    const after = Date.now()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true })

    expect(otpUpdate).toHaveBeenCalledWith({
      where: { id: 'otp-1' },
      data: { used: true },
    })

    expect(userUpdate).toHaveBeenCalledTimes(1)
    const updateArgs = userUpdate.mock.calls[0][0]
    expect(updateArgs.where).toEqual({ id: 'u1' })
    expect(updateArgs.data.failedOtpAttempts).toBe(0)
    expect(updateArgs.data.otpLockedUntil).toBeNull()
    const verifiedTs = (updateArgs.data.twoFactorVerifiedAt as Date).getTime()
    expect(verifiedTs).toBeGreaterThanOrEqual(before)
    expect(verifiedTs).toBeLessThanOrEqual(after)
  })
})
