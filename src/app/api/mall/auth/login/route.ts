/**
 * Mall Property Manager Login API
 * Step 1 of 2: Validates credentials and sends an OTP to the tenant's registered email.
 * Step 2 is handled by /api/mall/auth/verify-otp.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePropertyManager } from '@/config/mall-auth';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, createSessionToken, decodeSessionToken } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit, getClientIP } from '@/lib/auth/rate-limiter';
import { logAuthSuccess, logAuthFailure } from '@/lib/audit/logger.server';
import { createPendingOTP } from '@/lib/auth/otp-store';
import { sendOTPEmail, maskEmail } from '@/lib/email/sendOTP';

// Session configuration
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours

// When DEMO_MODE=true, skip OTP so demos don't require SMTP setup
const DEMO_MODE = process.env.DEMO_MODE === 'true';

interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * POST /api/mall/auth/login
 * Authenticates property manager and either:
 *  - (DEMO_MODE) creates session immediately, or
 *  - sends OTP email and returns { requiresOTP: true, pendingToken, emailHint }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP);

    if (rateLimit.rateLimited) {
      const resetInMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);

      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: resetInMinutes,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetInMinutes * 60),
          },
        }
      );
    }

    const body: LoginRequest = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    const propertyAuth = await validatePropertyManager(userId, password);

    if (!propertyAuth) {
      console.warn(`Failed login attempt for userId: ${userId} from IP: ${clientIP}`);
      await logAuthFailure(userId, 'Invalid credentials', clientIP);

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // DEMO MODE — skip OTP, create session immediately
    if (DEMO_MODE) {
      resetRateLimit(clientIP);
      await logAuthSuccess(userId, propertyAuth.mallId, clientIP);

      const sessionToken = createSessionToken(
        propertyAuth.userId,
        propertyAuth.mallId,
        propertyAuth.isMultiProperty,
        propertyAuth.properties
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
        mallId: propertyAuth.mallId,
        companyName: propertyAuth.companyName,
        mallDisplayName: propertyAuth.mallDisplayName,
        isMultiProperty: propertyAuth.isMultiProperty ?? false,
        properties: propertyAuth.properties ?? [],
        csrfToken: sessionData?.csrfToken,
      });
    }

    // PRODUCTION — send OTP
    if (!propertyAuth.email) {
      // No email configured for this tenant — fail securely
      console.error(`No email configured for userId: ${userId}`);
      return NextResponse.json(
        { error: 'Two-factor authentication is not configured for this account. Contact your administrator.' },
        { status: 500 }
      );
    }

    const { pendingToken, code } = createPendingOTP({
      userId: propertyAuth.userId,
      mallId: propertyAuth.mallId,
      companyName: propertyAuth.companyName,
      mallDisplayName: propertyAuth.mallDisplayName,
      isMultiProperty: propertyAuth.isMultiProperty,
      properties: propertyAuth.properties,
    });

    await sendOTPEmail(propertyAuth.email, code, propertyAuth.mallDisplayName);

    return NextResponse.json({
      requiresOTP: true,
      pendingToken,
      emailHint: maskEmail(propertyAuth.email),
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mall/auth/login
 * Check current session status
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    const sessionData = decodeSessionToken(sessionToken);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false, expired: true });
    }

    const { getPropertyAuth } = await import('@/config/mall-auth');
    const property = await getPropertyAuth(sessionData.userId);

    return NextResponse.json({
      authenticated: true,
      userId: sessionData.userId,
      mallId: sessionData.mallId,
      companyName: property?.companyName,
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
