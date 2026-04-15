import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { authConfig } from './auth.config'
import prisma from './app/lib/prisma'

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true },
    })
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw new Error('Failed to fetch user.')
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // First login — user object exists, set token fields
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.customerId = (user as any).customerId
        token.customerName = user.customerName
        token.twoFactorVerified = false
        token.passwordChangedAt = (user as any).passwordChangedAt || null
      }

      // On every request — check if user still exists and if 2FA is done
      if (token.id && !token.twoFactorVerified) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { twoFactorVerifiedAt: true },
          })

          // User deleted after reseed — kill session
          if (!dbUser) {
            return {} as any
          }

          if (dbUser.twoFactorVerifiedAt) {
            token.twoFactorVerified = true
          }
        } catch {
          // Ignore DB errors in JWT callback
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.customerId = token.customerId as string
        session.user.customerName = token.customerName as string
        ;(session.user as any).passwordChangedAt = token.passwordChangedAt ?? null
        ;(session as any).twoFactorVerified = token.twoFactorVerified
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate input format
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { email, password } = parsed.data

        // Find user
        const user = await getUser(email)
        if (!user) return null

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
          throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`)
        }

        // Compare password
        const passwordsMatch = await bcrypt.compare(password, user.password)

        if (!passwordsMatch) {
          // Wrong password — increment attempts
          const attempts = user.failedLoginAttempts + 1

          if (attempts >= 5) {
            // Lock account for 15 minutes
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
              },
            })
            throw new Error('Too many failed attempts. Account locked for 15 minutes.')
          }

          // Not locked yet — just increment
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts },
          })

          throw new Error(`Invalid credentials. ${5 - attempts} attempts remaining.`)
        }

        // Correct password — reset attempts, clear lock, start 2FA
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
      },
    }),
  ],
})