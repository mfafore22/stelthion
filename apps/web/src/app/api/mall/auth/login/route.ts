/**
 * Mall Property Manager Login API
 * Validates credentials and establishes secure session
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePropertyManager } from '@/config/mall-auth';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, createSessionToken } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit, getClientIP } from '@/lib/auth/rate-limiter';
import { logAuthSuccess, logAuthFailure } from '@/lib/audit/logger.server';

// Session configuration
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours

interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * POST /api/mall/auth/login
 * Authenticates property manager and creates session
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
            'Retry-After': String(resetInMinutes * 60), // seconds
          },
        }
      );
    }

    const body: LoginRequest = await request.json();
    const { userId, password } = body;

    // Validate input
    if (!userId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials (now async with bcrypt)
    const propertyAuth = await validatePropertyManager(userId, password);

    if (!propertyAuth) {
      // Log failed attempt
      console.warn(`Failed login attempt for userId: ${userId} from IP: ${clientIP}`);
      await logAuthFailure(userId, 'Invalid credentials', clientIP);

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Successful login - reset rate limit
    resetRateLimit(clientIP);

    // Log successful authentication
    await logAuthSuccess(userId, propertyAuth.mallId, clientIP);

    // Create session token with multi-property support
    const sessionToken = createSessionToken(
      propertyAuth.userId,
      propertyAuth.mallId,
      propertyAuth.isMultiProperty,
      propertyAuth.properties
    );

    // Decode token to extract CSRF token for client
    const { decodeSessionToken } = await import('@/lib/auth/session');
    const sessionData = decodeSessionToken(sessionToken);
    const csrfToken = sessionData?.csrfToken;

    // Set secure cookie with enhanced security settings
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true, // Prevent XSS access to cookie
      secure: isProduction, // HTTPS only in production (allows HTTP in dev)
      sameSite: 'lax', // CSRF protection while allowing legitimate cross-site navigation
      maxAge: SESSION_MAX_AGE, // 8 hours
      path: '/', // Available to all routes (needed for /api/mall/* endpoints)
      // domain can be set via env var for multi-subdomain setups
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
    });

    // Return success with authorized mall ID and CSRF token
    return NextResponse.json({
      success: true,
      mallId: propertyAuth.mallId,
      companyName: propertyAuth.companyName,
      mallDisplayName: propertyAuth.mallDisplayName,
      isMultiProperty: propertyAuth.isMultiProperty ?? false,
      properties: propertyAuth.properties ?? [],
      csrfToken, // Return CSRF token for client-side storage
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

    // Decode and verify JWT session token
    const { decodeSessionToken } = await import('@/lib/auth/session');
    const sessionData = decodeSessionToken(sessionToken);

    if (!sessionData) {
      return NextResponse.json({ authenticated: false, expired: true });
    }

    // Get property details
    const { getPropertyAuth } = await import('@/config/mall-auth');
    const property = getPropertyAuth(sessionData.userId);

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
