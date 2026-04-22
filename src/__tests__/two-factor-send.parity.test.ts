/**
 * @jest-environment node
 *
 * Phase A.5 parity test — POST /api/two-factor/send.
 *
 * Contract:
 *   - 401 when no session
 *   - { alreadyVerified: true } short-circuit when twoFactorVerifiedAt is set
 *   - 30-second duplicate-send window: silent return on resend within window
 *   - On send: invalidates prior unused OTPs for the email, creates new
 *     EmailOtp row with 10-minute expiry
 *   - Without RESEND_API_KEY: dev-mode console log (no fetch call)
 *   - Returns { success: true, sent: true, emailHint } in success case
 *
 * Note: we read the route via require() at top so the mock factory
 * registration is in scope before the route module imports prisma.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    emailOtp: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { POST } from '@/app/api/two-factor/send/route'
import { maskEmail } from '@/lib/email/sendOTP'
import prisma from '@/server/db/client'
import { auth } from '@/auth'

const userFindUnique = (prisma as any).user.findUnique as jest.Mock
const otpFindFirst = (prisma as any).emailOtp.findFirst as jest.Mock
const otpUpdateMany = (prisma as any).emailOtp.updateMany as jest.Mock
const otpCreate = (prisma as any).emailOtp.create as jest.Mock
const authMock = auth as unknown as jest.Mock

const ORIGINAL_RESEND_KEY = process.env.RESEND_API_KEY

beforeEach(() => {
  userFindUnique.mockReset()
  otpFindFirst.mockReset()
  otpUpdateMany.mockReset()
  otpCreate.mockReset()
  authMock.mockReset()
  // Force dev mode (no real fetch) for deterministic tests.
  delete process.env.RESEND_API_KEY
})

afterAll(() => {
  if (ORIGINAL_RESEND_KEY !== undefined) process.env.RESEND_API_KEY = ORIGINAL_RESEND_KEY
})

describe('POST /api/two-factor/send — guards', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns 401 when session has no email', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST()
    expect(res.status).toBe(401)
  })
})

describe('POST /api/two-factor/send — alreadyVerified short-circuit', () => {
  it('returns { alreadyVerified: true } and does not lookup OTPs', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
    userFindUnique.mockResolvedValue({
      twoFactorVerifiedAt: new Date(),
    })
    const res = await POST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ alreadyVerified: true })
    expect(otpFindFirst).not.toHaveBeenCalled()
    expect(otpCreate).not.toHaveBeenCalled()
  })
})

describe('POST /api/two-factor/send — happy path (sends new OTP)', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'alice@example.com' } })
    userFindUnique.mockResolvedValue({ twoFactorVerifiedAt: null })
    otpFindFirst.mockResolvedValue(null) // no recent OTP within 30s
  })

  it('invalidates prior unused OTPs and creates a new one with 10-minute expiry', async () => {
    const before = Date.now()
    const res = await POST()
    const after = Date.now()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      success: true,
      sent: true,
      emailHint: maskEmail('alice@example.com'),
    })

    // prior unused OTPs are marked used
    expect(otpUpdateMany).toHaveBeenCalledWith({
      where: { email: 'alice@example.com', used: false },
      data: { used: true },
    })

    // new OTP created with 10-minute expiry
    expect(otpCreate).toHaveBeenCalledTimes(1)
    const createArgs = otpCreate.mock.calls[0][0]
    expect(createArgs.data.email).toBe('alice@example.com')
    expect(createArgs.data.code).toMatch(/^\d{6}$/)
    const expiresTs = (createArgs.data.expiresAt as Date).getTime()
    expect(expiresTs).toBeGreaterThanOrEqual(before + 10 * 60 * 1000 - 50)
    expect(expiresTs).toBeLessThanOrEqual(after + 10 * 60 * 1000 + 50)
  })
})

describe('POST /api/two-factor/send — 30-second dedupe window', () => {
  it('silently swallows resend when an unused OTP was created within 30s', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'alice@example.com' } })
    userFindUnique.mockResolvedValue({ twoFactorVerifiedAt: null })
    otpFindFirst.mockResolvedValue({
      id: 'recent-otp',
      email: 'alice@example.com',
      used: false,
      createdAt: new Date(Date.now() - 5 * 1000), // 5s ago
    })

    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    // Route returns the sent: true envelope only if it actually sent.
    // The dedupe path returns void from the helper, so the route still
    // returns success/sent/emailHint envelope. Lock in current behavior:
    expect(body).toMatchObject({
      success: true,
      sent: true,
      emailHint: maskEmail('alice@example.com'),
    })
    // Critical: no new OTP row was written.
    expect(otpUpdateMany).not.toHaveBeenCalled()
    expect(otpCreate).not.toHaveBeenCalled()
  })
})

// ─── Helper parity ─────────────────────────────────────

describe('maskEmail', () => {
  it('keeps first character + masks rest of local part', () => {
    expect(maskEmail('alice@example.com')).toBe('a****@example.com')
  })
  it('caps the mask at 5 stars even for long local parts', () => {
    expect(maskEmail('aaaaaaaaaaa@example.com')).toBe('a*****@example.com')
  })
  it('returns the original string when local part is too short to mask', () => {
    expect(maskEmail('a@example.com')).toBe('a@example.com')
  })
  it('returns the original string when there is no @', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })
})
