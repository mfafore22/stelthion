import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Validates that the current session has ADMIN role.
 * Use at the top of every /api/admin/* route handler.
 * Returns the session if valid, or a 401/403 NextResponse.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (session.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}
