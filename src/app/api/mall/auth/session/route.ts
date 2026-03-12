/**
 * GET /api/mall/auth/session
 * Returns current session user data for client SessionContext
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, decodeSessionToken } from '@/lib/auth/session';
import { getTenantConfig } from '@/config/tenant-registry';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const sessionData = decodeSessionToken(sessionToken);

    if (!sessionData) {
      return NextResponse.json({ user: null });
    }

    // Enrich with display info from tenant registry
    const tenant = getTenantConfig(sessionData.userId);

    return NextResponse.json({
      user: {
        userId: sessionData.userId,
        mallId: sessionData.mallId,
        companyName: tenant?.companyName ?? sessionData.userId,
        mallDisplayName: tenant?.mallDisplayName ?? sessionData.mallId,
        isMultiProperty: sessionData.isMultiProperty ?? false,
        properties: sessionData.properties ?? [],
      },
      csrfToken: sessionData.csrfToken ?? null,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
