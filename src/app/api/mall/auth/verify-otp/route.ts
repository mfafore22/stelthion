/**
 * Mall OTP Verification API
 * Step 2 of 2: Verifies the 6-digit email code and creates the authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, createSessionToken, decodeSessionToken } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit, getClientIP } from '@/lib/auth/rate-limiter';
import { logAuthSuccess, logAuthFailure } from '@/lib/audit/logger.server';
import { verifyOTP } from '@/lib/auth/otp-store';

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours

interface VerifyOTPRequest {
  pendingToken: string;
  code: string;
}

/**
 * POST /api/mall/auth/verify-otp
 * Verifies OTP code, creates session cookie on success.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP to prevent brute-forcing the 6-digit code
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP);

    if (rateLimit.rateLimited) {
      const resetInMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          retryAfter: resetInMinutes,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(resetInMinutes * 60) },
        }
      );
    }

    const body: VerifyOTPRequest = await request.json();
    const { pendingToken, code } = body;

    if (!pendingToken || !code) {
      return NextResponse.json(
        { error: 'Verification code and session token are required' },
        { status: 400 }
      );
    }

    // Verify the OTP — returns entry on success, null on failure/expiry
    const entry = verifyOTP(pendingToken, code.trim());

    if (!entry) {
      await logAuthFailure('unknown', 'Invalid or expired OTP', clientIP);
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      );
    }

    // OTP verified — create full session
    resetRateLimit(clientIP);
    await logAuthSuccess(entry.userId, entry.mallId, clientIP);

    const sessionToken = createSessionToken(
      entry.userId,
      entry.mallId,
      entry.isMultiProperty,
      entry.properties
    );

    const sessionData = decodeSessionToken(sessionToken);
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    });

    return NextResponse.json({
      success: true,
      mallId: entry.mallId,
      companyName: entry.companyName,
      mallDisplayName: entry.mallDisplayName,
      isMultiProperty: entry.isMultiProperty ?? false,
      properties: entry.properties ?? [],
      csrfToken: sessionData?.csrfToken,
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
