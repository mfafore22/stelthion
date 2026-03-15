/**
 * Session Management Utilities
 * Server-side session verification and management
 */

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getPropertyAuth, type MallPropertyAuth } from '@/config/mall-auth';

export const SESSION_COOKIE_NAME = 'mall_property_session';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET_KEY || 'dev-secret-key-not-for-production';

  if (!process.env.JWT_SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET_KEY not set in production environment.');
  }

  return secret;
}

export interface SessionData {
  userId: string;
  mallId: string;
  timestamp: number;
  csrfToken?: string;
  isMultiProperty?: boolean;
  properties?: string[];
}

/**
 * Verifies and decodes a session token using JWT
 */
export function decodeSessionToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as SessionData;

    const now = Date.now();
    const sessionAge = now - decoded.timestamp;
    const eightHours = 8 * 60 * 60 * 1000;

    if (sessionAge > eightHours) {
      return null;
    }

    return decoded;
  } catch (error) {
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
 * Gets the authenticated property manager details from database
 */
export async function getAuthenticatedPropertyManager(): Promise<MallPropertyAuth | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return await getPropertyAuth(session.userId);
}

/**
 * Verifies user has access to a specific mall
 */
export async function verifyMallAccess(mallId: string): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  if (session.isMultiProperty && session.properties) {
    return session.properties.includes(mallId);
  }

  return session.mallId === mallId;
}

/**
 * Generates a cryptographically random CSRF token
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a signed JWT session token with CSRF protection
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

  return jwt.sign(sessionData, getJWTSecret(), {
    expiresIn: '8h',
    algorithm: 'HS256',
  });
}