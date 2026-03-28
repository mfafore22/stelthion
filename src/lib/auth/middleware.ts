import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Require authenticated session for API routes.
 * Returns the session or an error response.
 */
export async function requireSession() {
  const session = await auth()

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { session }
}

/**
 * Require authenticated session and verify the user belongs to the
 * company that owns the specified mall.
 */
export async function requireMallAccess(mallCustomerId: string) {
  const session = await auth()

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (session.user.customerId !== mallCustomerId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { session }
}
