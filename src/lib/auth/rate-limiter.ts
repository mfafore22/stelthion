/**
 * Rate Limiter for Authentication
 * Prevents brute-force attacks by limiting login attempts per IP.
 * Uses in-memory store — replace with Redis for distributed deployments.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10)
const WINDOW_MS = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000

export function checkRateLimit(ip: string): {
  rateLimited: boolean
  remainingAttempts: number
  resetTime: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return { rateLimited: false, remainingAttempts: MAX_ATTEMPTS - 1, resetTime: now + WINDOW_MS }
  }

  entry.count++
  rateLimitStore.set(ip, entry)

  if (entry.count > MAX_ATTEMPTS) {
    return { rateLimited: true, remainingAttempts: 0, resetTime: entry.resetTime }
  }

  return { rateLimited: false, remainingAttempts: MAX_ATTEMPTS - entry.count, resetTime: entry.resetTime }
}

export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip)
}

export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 10 * 60 * 1000)
}

export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIP = headers.get('x-real-ip')
  if (realIP) return realIP

  return 'unknown'
}
