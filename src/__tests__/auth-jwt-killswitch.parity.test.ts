/**
 * @jest-environment node
 *
 * Phase A.5 parity test — JWT callback kill-switch & 2FA enforcement.
 *
 * Same architectural constraint as auth-credentials.parity.test.ts:
 * the jwt callback in src/auth.ts:28-61 lives inside the
 * NextAuth({...}) closure and cannot be invoked directly without
 * refactoring auth.ts (forbidden until Phase H).
 *
 * Two-layer parity guard:
 *   Layer 1 (this file): jwtCallbackSpec mirrors src/auth.ts:28-61
 *     line-for-line. Tests cover:
 *       - first-login token hydration
 *       - kill-switch when user is deleted from DB
 *       - 2FA recheck on every request until twoFactorVerifiedAt is set
 *       - twoFactorVerified stays true once set (no extra DB hit)
 *       - DB error tolerance (callback does not crash)
 *   Layer 2 (proxy-policy.parity.test.ts): text-snapshot of src/auth.ts
 *     asserting `if (!dbUser)`, `return {} as any`, `!token.twoFactorVerified`
 *     branches still exist.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Token {
  id?: string
  role?: string
  customerId?: string
  customerName?: string
  twoFactorVerified?: boolean
  passwordChangedAt?: string | null
}

interface User {
  id: string
  role: string
  customerId: string
  customerName: string
  passwordChangedAt: string | null
}

interface PrismaSpec {
  user: { findUnique: jest.Mock }
}

async function jwtCallbackSpec(
  args: { token: Token; user?: User | null },
  prisma: PrismaSpec,
): Promise<Token> {
  const { token, user } = args

  if (user) {
    token.id = user.id
    token.role = (user as any).role
    token.customerId = (user as any).customerId
    token.customerName = user.customerName
    token.twoFactorVerified = false
    token.passwordChangedAt = (user as any).passwordChangedAt || null
  }

  if (token.id && !token.twoFactorVerified) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { twoFactorVerifiedAt: true },
      })

      // Kill-switch: user deleted after reseed → kill session
      if (!dbUser) {
        return {} as any
      }

      if (dbUser.twoFactorVerifiedAt) {
        token.twoFactorVerified = true
      }
    } catch {
      // ignore DB errors in JWT callback
    }
  }

  return token
}

let prisma: PrismaSpec

beforeEach(() => {
  prisma = { user: { findUnique: jest.fn() } }
})

describe('jwtCallbackSpec — first login (user object present)', () => {
  it('hydrates token from user object and sets twoFactorVerified=false', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      twoFactorVerifiedAt: null,
    })
    const result = await jwtCallbackSpec(
      {
        token: {},
        user: {
          id: 'u1',
          role: 'ADMIN',
          customerId: 'cust-1',
          customerName: 'Acme',
          passwordChangedAt: null,
        },
      },
      prisma,
    )
    expect(result).toMatchObject({
      id: 'u1',
      role: 'ADMIN',
      customerId: 'cust-1',
      customerName: 'Acme',
      twoFactorVerified: false,
      passwordChangedAt: null,
    })
  })

  it('preserves passwordChangedAt as ISO string when present on user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      twoFactorVerifiedAt: null,
    })
    const result = await jwtCallbackSpec(
      {
        token: {},
        user: {
          id: 'u1',
          role: 'USER',
          customerId: 'cust-1',
          customerName: 'Acme',
          passwordChangedAt: '2024-01-01T00:00:00.000Z',
        },
      },
      prisma,
    )
    expect(result.passwordChangedAt).toBe('2024-01-01T00:00:00.000Z')
  })
})

describe('jwtCallbackSpec — kill-switch (user deleted)', () => {
  it('returns empty object when user no longer exists in DB', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const result = await jwtCallbackSpec(
      {
        token: {
          id: 'u1',
          role: 'USER',
          customerId: 'cust-1',
          twoFactorVerified: false,
        },
      },
      prisma,
    )
    expect(result).toEqual({})
    // No id → next-auth treats as unauthenticated
    expect(result.id).toBeUndefined()
  })

  it('does NOT hit DB when twoFactorVerified is already true', async () => {
    const result = await jwtCallbackSpec(
      {
        token: {
          id: 'u1',
          role: 'USER',
          customerId: 'cust-1',
          twoFactorVerified: true,
        },
      },
      prisma,
    )
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(result.id).toBe('u1')
    expect(result.twoFactorVerified).toBe(true)
  })

  it('does NOT hit DB when token has no id (anonymous)', async () => {
    const result = await jwtCallbackSpec({ token: {} }, prisma)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })
})

describe('jwtCallbackSpec — 2FA promotion', () => {
  it('promotes token.twoFactorVerified to true when DB has twoFactorVerifiedAt set', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      twoFactorVerifiedAt: new Date(),
    })
    const result = await jwtCallbackSpec(
      {
        token: {
          id: 'u1',
          role: 'USER',
          customerId: 'cust-1',
          twoFactorVerified: false,
        },
      },
      prisma,
    )
    expect(result.twoFactorVerified).toBe(true)
  })

  it('keeps twoFactorVerified false when DB twoFactorVerifiedAt is null', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      twoFactorVerifiedAt: null,
    })
    const result = await jwtCallbackSpec(
      {
        token: {
          id: 'u1',
          role: 'USER',
          customerId: 'cust-1',
          twoFactorVerified: false,
        },
      },
      prisma,
    )
    expect(result.twoFactorVerified).toBe(false)
  })
})

describe('jwtCallbackSpec — DB error tolerance', () => {
  it('does not crash when DB throws; preserves prior token', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'))
    const result = await jwtCallbackSpec(
      {
        token: {
          id: 'u1',
          role: 'USER',
          customerId: 'cust-1',
          twoFactorVerified: false,
        },
      },
      prisma,
    )
    // Token survives the DB error
    expect(result.id).toBe('u1')
    expect(result.twoFactorVerified).toBe(false)
  })
})
