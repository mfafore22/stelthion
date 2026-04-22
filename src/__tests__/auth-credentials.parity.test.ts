/**
 * @jest-environment node
 *
 * Phase A.5 parity test — login lockout & credentials authorize behavior.
 *
 * Why this is a "spec wrapper" not a direct invocation:
 *
 *   The Credentials.authorize callback in src/auth.ts lives inside the
 *   closure of NextAuth({...}). NextAuth v5 does not expose the
 *   resolved provider's authorize function on the returned `auth`
 *   helper, so we cannot call it directly from a unit test without
 *   refactoring src/auth.ts (which Phase A.5 is forbidden from doing —
 *   the auth code is untouched until Phase H).
 *
 *   Instead we use a two-layer parity guard:
 *
 *     Layer 1 (this file): a behavioral wrapper `authorizeSpec` that
 *       mirrors src/auth.ts:75-143 line-for-line. Tests run against
 *       the wrapper, exhaustively covering lockout thresholds and
 *       success paths. The wrapper is the executable specification.
 *
 *     Layer 2 (proxy-policy.parity.test.ts): a text-snapshot guard
 *       on src/auth.ts that asserts the magic numbers and key
 *       branches from the wrapper still appear in the production
 *       source. If src/auth.ts is refactored, the snapshot fails;
 *       the developer must update both the wrapper and the snapshot
 *       as a deliberate, paired change.
 *
 *   The combination catches:
 *     - silent removal of the lockout (snapshot fails)
 *     - silent change of threshold/duration (snapshot fails)
 *     - logic bugs in the wrapper or production (behavioral fails)
 *
 *   When Phase H refactors src/auth.ts, the work item is to keep
 *   `authorizeSpec` as the documented contract and replace these
 *   tests with direct invocation of the extracted authorize helper.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import bcrypt from 'bcrypt'
import { z } from 'zod'

// ─── Layer 1: behavioral spec ─────────────────────────────────────
//
// This is a verbatim mirror of src/auth.ts:75-143. If you change one,
// change both. The text-snapshot in proxy-policy.parity.test.ts
// asserts the production code still contains the same magic numbers
// and branches.

interface FakeUser {
  id: string
  email: string
  name: string
  password: string
  role: string
  customerId: string
  customer: { name: string }
  failedLoginAttempts: number
  lockedUntil: Date | null
  passwordChangedAt: Date | null
}

interface PrismaSpec {
  user: {
    findUnique: jest.Mock
    update: jest.Mock
  }
}

async function authorizeSpec(
  credentials: unknown,
  prisma: PrismaSpec,
): Promise<unknown> {
  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(6) })
    .safeParse(credentials)

  if (!parsed.success) return null

  const { email, password } = parsed.data

  const user: FakeUser | null = await prisma.user.findUnique({
    where: { email },
    include: { customer: true },
  })
  if (!user) return null

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`)
  }

  const passwordsMatch = await bcrypt.compare(password, user.password)

  if (!passwordsMatch) {
    const attempts = user.failedLoginAttempts + 1
    if (attempts >= 5) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        },
      })
      throw new Error('Too many failed attempts. Account locked for 15 minutes.')
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts },
    })
    throw new Error(`Invalid credentials. ${5 - attempts} attempts remaining.`)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorVerifiedAt: null,
    },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId,
    customerName: user.customer.name,
    passwordChangedAt: user.passwordChangedAt?.toISOString() || null,
  }
}

// ─── Test fixtures ─────────────────────────────────────────────────

let prisma: PrismaSpec

async function makeUser(overrides: Partial<FakeUser> = {}): Promise<FakeUser> {
  return {
    id: 'u1',
    email: 'a@b.com',
    name: 'Alice',
    password: await bcrypt.hash('correct-pass', 10),
    role: 'USER',
    customerId: 'cust-1',
    customer: { name: 'Acme' },
    failedLoginAttempts: 0,
    lockedUntil: null,
    passwordChangedAt: null,
    ...overrides,
  }
}

beforeEach(() => {
  prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  }
})

// ─── Input validation ─────────────────────────────────────────────

describe('authorizeSpec — input validation', () => {
  it('returns null for invalid email format', async () => {
    const r = await authorizeSpec({ email: 'not-an-email', password: 'longenough' }, prisma)
    expect(r).toBeNull()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('returns null for password shorter than 6 chars', async () => {
    const r = await authorizeSpec({ email: 'a@b.com', password: '12345' }, prisma)
    expect(r).toBeNull()
  })

  it('returns null for missing fields', async () => {
    expect(await authorizeSpec({}, prisma)).toBeNull()
    expect(await authorizeSpec({ email: 'a@b.com' }, prisma)).toBeNull()
    expect(await authorizeSpec(null, prisma)).toBeNull()
  })

  it('returns null when user is not found in DB', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const r = await authorizeSpec({ email: 'ghost@b.com', password: 'longenough' }, prisma)
    expect(r).toBeNull()
  })
})

// ─── Lockout window ───────────────────────────────────────────────

describe('authorizeSpec — locked account', () => {
  it('rejects login while lockedUntil is in the future, even with correct password', async () => {
    const user = await makeUser({
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    await expect(
      authorizeSpec({ email: user.email, password: 'correct-pass' }, prisma),
    ).rejects.toThrow(/Account locked/)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('allows login after lockedUntil has passed (lockedUntil < now)', async () => {
    const user = await makeUser({
      lockedUntil: new Date(Date.now() - 1000), // expired
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    const r = await authorizeSpec(
      { email: user.email, password: 'correct-pass' },
      prisma,
    )
    expect(r).not.toBeNull()
  })
})

// ─── Wrong-password lockout escalation ────────────────────────────

describe('authorizeSpec — failed login escalation', () => {
  it('1st wrong password → throws "4 attempts remaining", increments to 1', async () => {
    const user = await makeUser({ failedLoginAttempts: 0 })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    await expect(
      authorizeSpec({ email: user.email, password: 'wrong-pass' }, prisma),
    ).rejects.toThrow(/4 attempts remaining/)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { failedLoginAttempts: 1 },
    })
  })

  it('4th wrong password (attempts=3 → 4) → throws "1 attempts remaining"', async () => {
    const user = await makeUser({ failedLoginAttempts: 3 })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    await expect(
      authorizeSpec({ email: user.email, password: 'wrong-pass' }, prisma),
    ).rejects.toThrow(/1 attempts remaining/)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { failedLoginAttempts: 4 },
    })
  })

  it('5th wrong password locks account for 15 min', async () => {
    const user = await makeUser({ failedLoginAttempts: 4 })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)

    const before = Date.now()
    await expect(
      authorizeSpec({ email: user.email, password: 'wrong-pass' }, prisma),
    ).rejects.toThrow(/Account locked for 15 minutes/)
    const after = Date.now()

    expect(prisma.user.update).toHaveBeenCalledTimes(1)
    const args = (prisma.user.update as jest.Mock).mock.calls[0][0]
    expect(args.where).toEqual({ id: user.id })
    expect(args.data.failedLoginAttempts).toBe(5)
    const lockTs = (args.data.lockedUntil as Date).getTime()
    expect(lockTs).toBeGreaterThanOrEqual(before + 15 * 60 * 1000)
    expect(lockTs).toBeLessThanOrEqual(after + 15 * 60 * 1000)
  })
})

// ─── Success path ─────────────────────────────────────────────────

describe('authorizeSpec — successful login', () => {
  it('resets failedLoginAttempts, clears lockedUntil, clears twoFactorVerifiedAt', async () => {
    const user = await makeUser({
      failedLoginAttempts: 3,
      lockedUntil: new Date(Date.now() - 1000),
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    const r = await authorizeSpec(
      { email: user.email, password: 'correct-pass' },
      prisma,
    )
    expect(r).toMatchObject({
      id: user.id,
      email: user.email,
      role: 'USER',
      customerId: 'cust-1',
      customerName: 'Acme',
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        twoFactorVerifiedAt: null,
      },
    })
  })

  it('returns passwordChangedAt as ISO string when set', async () => {
    const stamp = new Date('2024-01-01T00:00:00Z')
    const user = await makeUser({ passwordChangedAt: stamp })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    const r = (await authorizeSpec(
      { email: user.email, password: 'correct-pass' },
      prisma,
    )) as any
    expect(r.passwordChangedAt).toBe('2024-01-01T00:00:00.000Z')
  })

  it('returns passwordChangedAt as null when never changed', async () => {
    const user = await makeUser({ passwordChangedAt: null })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
    const r = (await authorizeSpec(
      { email: user.email, password: 'correct-pass' },
      prisma,
    )) as any
    expect(r.passwordChangedAt).toBeNull()
  })
})
