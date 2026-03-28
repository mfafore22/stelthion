import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Validates that the current session has ADMIN role.
 * Use at the top of every /api/admin/* route handler.
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (session.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { session }
}

/**
 * Validates that the current session has ADMIN or MANAGER role.
 */
export async function requireAdminOrManager() {
  const session = await auth()

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { session }
}
