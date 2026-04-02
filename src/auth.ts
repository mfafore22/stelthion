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
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    async jwt({ token, user }) {
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

          if (dbUser?.twoFactorVerifiedAt) {
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
        ;(session.user as any).passwordChangeAt  = token.passwordChangedAt ?? null
        ;(session as any).twoFactorVerified = token.twoFactorVerified
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          const user = await getUser(email)
          if (!user) return null

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (passwordsMatch) {
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorVerifiedAt: null },
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
        }

        return null
      },
    }),
  ],
})