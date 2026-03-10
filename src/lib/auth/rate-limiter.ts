/**
 * Rate Limiter for Authentication
 * Prevents brute-force attacks by limiting login attempts per IP
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration from environment
const MAX_ATTEMPTS = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10);
const WINDOW_MS = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000; // Convert minutes to ms

/**
 * Check if IP address has exceeded rate limit
 * @param ip - Client IP address
 * @returns Object with rateLimited flag and remaining attempts
 */
export function checkRateLimit(ip: string): {
  rateLimited: boolean;
  remainingAttempts: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // No previous attempts or window expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return {
      rateLimited: false,
      remainingAttempts: MAX_ATTEMPTS - 1,
      resetTime: now + WINDOW_MS,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(ip, entry);

  // Check if limit exceeded
  if (entry.count > MAX_ATTEMPTS) {
    return {
      rateLimited: true,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    rateLimited: false,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for an IP (call after successful login)
 * @param ip - Client IP address
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 10 * 60 * 1000);
}

/**
 * Get client IP from request headers (handles proxies)
 * @param headers - Request headers
 * @returns Client IP address
 */
export function getClientIP(headers: Headers): string {
  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection info (not available in Edge runtime)
  return 'unknown';
}
