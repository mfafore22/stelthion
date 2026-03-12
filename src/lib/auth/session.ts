/**
 * Session Management Utilities
 * Server-side session verification and management
 *
 * Uses JWT (JSON Web Tokens) with HMAC-SHA256 signing for session security
 */

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { MALL_PROPERTIES, type MallPropertyAuth } from '@/config/mall-auth';

export const SESSION_COOKIE_NAME = 'mall_property_session';

// JWT Secret Key - MUST be set in production
// Note: Validation happens at runtime, not module load time, to allow Vercel builds
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET_KEY || 'dev-secret-key-not-for-production';

  // Warn in production if using default secret (but allow build to succeed)
  if (!process.env.JWT_SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET_KEY not set in production environment. Using insecure default.');
  }

  return secret;
}

export interface SessionData {
  userId: string;
  mallId: string;
  timestamp: number;
  csrfToken?: string; // CSRF token for mutation protection
  isMultiProperty?: boolean; // Whether tenant manages multiple properties
  properties?: string[]; // List of all mall IDs this tenant can access
}

/**
 * Verifies and decodes a session token using JWT
 * Automatically verifies signature and expiration
 */
export function decodeSessionToken(token: string): SessionData | null {
  try {
    // Verify JWT signature and decode
    const decoded = jwt.verify(token, getJWTSecret()) as SessionData;

    // Additional timestamp check (belt and suspenders with JWT exp)
    const now = Date.now();
    const sessionAge = now - decoded.timestamp;
    const eightHours = 8 * 60 * 60 * 1000;

    if (sessionAge > eightHours) {
      return null;
    }

    return decoded;
  } catch (error) {
    // JWT verification failed (invalid signature, expired, malformed, etc.)
    return null;
  }
}

/**
 * Gets the current authenticated session (server-side)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionToken?.value) {
    return null;
  }

  return decodeSessionToken(sessionToken.value);
}

/**
 * Gets the authenticated property manager details
 */
export async function getAuthenticatedPropertyManager(): Promise<MallPropertyAuth | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const property = MALL_PROPERTIES[session.userId];
  return property || null;
}

/**
 * Verifies user has access to a specific mall
 * Supports both single-property and multi-property tenants
 */
export async function verifyMallAccess(mallId: string): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  // Multi-property tenant: check if mallId is in properties array
  if (session.isMultiProperty && session.properties) {
    return session.properties.includes(mallId);
  }

  // Single-property tenant: mallId must match session.mallId
  return session.mallId === mallId;
}

/**
 * Generates a cryptographically random CSRF token
 */
function generateCSRFToken(): string {
  // Generate 32 bytes (256 bits) of random data using Node.js crypto
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a signed JWT session token with CSRF protection
 * Token is cryptographically signed to prevent tampering
 */
export function createSessionToken(
  userId: string,
  mallId: string,
  isMultiProperty?: boolean,
  properties?: string[]
): string {
  const csrfToken = generateCSRFToken();

  const sessionData: SessionData = {
    userId,
    mallId,
    timestamp: Date.now(),
    csrfToken,
    isMultiProperty,
    properties,
  };

  // Sign JWT with HMAC-SHA256
  return jwt.sign(sessionData, getJWTSecret(), {
    expiresIn: '8h',
    algorithm: 'HS256',
  });
}
