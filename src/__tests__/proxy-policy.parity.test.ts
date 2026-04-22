/**
 * @jest-environment node
 *
 * Phase A.5 parity test — locks in the route protection policy
 * implemented in src/proxy.ts and the authorized() callback in
 * src/auth.config.ts.
 *
 * The proxy uses NextAuth's higher-order auth() wrapper, which is
 * impractical to invoke under jest without a full NextAuth runtime.
 * Instead we use two complementary guards:
 *
 *   1) A real behavioral test of authConfig.callbacks.authorized()
 *      — that callback is a pure function exported from auth.config.ts
 *      and exercises the redirect rules used by the proxy.
 *
 *   2) A text-snapshot guard on src/proxy.ts that asserts the critical
 *      branches (public route allow-list, 2FA route allow-list,
 *      unauthenticated-redirect-to-login, API-401, static bypass)
 *      survive any future refactor.
 *
 * If either layer breaks, the policy has shifted and a human must
 * confirm whether the change was intentional.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs'
import path from 'path'
import { authConfig } from '@/auth.config'

const PROXY_PATH = path.join(process.cwd(), 'src', 'proxy.ts')
const AUTH_TS_PATH = path.join(process.cwd(), 'src', 'auth.ts')

const proxySrc = fs.readFileSync(PROXY_PATH, 'utf8')
const authSrc = fs.readFileSync(AUTH_TS_PATH, 'utf8')

// ─── Layer 1: behavioral test of authorized() ────────────────────

describe('authConfig.callbacks.authorized — redirect policy', () => {
  function call(opts: { isLoggedIn: boolean; pathname: string }) {
    const auth = opts.isLoggedIn ? ({ user: { id: 'u1' } } as any) : null
    const nextUrl = new URL(`http://localhost${opts.pathname}`)
    return (authConfig.callbacks as any).authorized({
      auth,
      request: { nextUrl },
    })
  }

  it('allows /login as a public route', () => {
    expect(call({ isLoggedIn: false, pathname: '/login' })).toBe(true)
  })

  it('allows /two-factor as a public route (pre-2FA flow)', () => {
    expect(call({ isLoggedIn: false, pathname: '/two-factor' })).toBe(true)
  })

  it('allows /mall/login as a public route', () => {
    expect(call({ isLoggedIn: false, pathname: '/mall/login' })).toBe(true)
  })

  it('lets /api/* through (route-level protection takes over)', () => {
    expect(call({ isLoggedIn: false, pathname: '/api/customers/123' })).toBe(true)
    expect(call({ isLoggedIn: true, pathname: '/api/admin/users' })).toBe(true)
  })

  it('redirects unauthenticated user away from /admin', () => {
    const result = call({ isLoggedIn: false, pathname: '/admin/dashboard' })
    expect(result).toBeInstanceOf(Response)
    // auth.config.ts uses native Response.redirect (302), not
    // NextResponse.redirect (307). Locking in the current behavior.
    expect((result as Response).status).toBe(302)
    expect((result as Response).headers.get('location')).toContain('/login')
  })

  it('redirects unauthenticated user away from /mall (non-login)', () => {
    const result = call({ isLoggedIn: false, pathname: '/mall/ideapark/dashboard' })
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).headers.get('location')).toContain('/login')
  })

  it('redirects unauthenticated user away from /tenant', () => {
    const result = call({ isLoggedIn: false, pathname: '/tenant/acme/portfolio' })
    expect(result).toBeInstanceOf(Response)
  })

  it('redirects unauthenticated user away from /dashboard', () => {
    const result = call({ isLoggedIn: false, pathname: '/dashboard' })
    expect(result).toBeInstanceOf(Response)
  })

  it('redirects logged-in user from / to /two-factor', () => {
    const result = call({ isLoggedIn: true, pathname: '/' })
    expect(result).toBeInstanceOf(Response)
    expect((result as Response).headers.get('location')).toContain('/two-factor')
  })

  it('lets logged-in user reach protected routes (returns true, no redirect)', () => {
    expect(call({ isLoggedIn: true, pathname: '/admin/dashboard' })).toBe(true)
    expect(call({ isLoggedIn: true, pathname: '/mall/ideapark' })).toBe(true)
    expect(call({ isLoggedIn: true, pathname: '/tenant/acme' })).toBe(true)
  })
})

// ─── Layer 2: text-snapshot guard on proxy.ts ────────────────────

describe('src/proxy.ts — structural parity guards', () => {
  it('matcher excludes _next static + image files', () => {
    expect(proxySrc).toMatch(/matcher.*_next\/static.*_next\/image/s)
  })

  it('declares /login as a public route', () => {
    expect(proxySrc).toMatch(/pathname === '\/login'/)
  })

  it('declares /api/auth as a public-route prefix', () => {
    expect(proxySrc).toMatch(/pathname\.startsWith\('\/api\/auth'\)/)
  })

  it('declares /two-factor and /api/two-factor as the 2FA route group', () => {
    expect(proxySrc).toMatch(/pathname === '\/two-factor'/)
    expect(proxySrc).toMatch(/pathname\.startsWith\('\/api\/two-factor'\)/)
  })

  it('declares /change-password and /api/changepassword and /api/account as the password-change route group', () => {
    expect(proxySrc).toMatch(/pathname === '\/change-password'/)
    expect(proxySrc).toMatch(/pathname\.startsWith\('\/api\/changepassword'\)/)
    expect(proxySrc).toMatch(/pathname\.startsWith\('\/api\/account'\)/)
  })

  it('returns 401 JSON for unauthenticated /api/* (not a redirect)', () => {
    expect(proxySrc).toMatch(/NextResponse\.json\(\s*\{\s*error:\s*'Unauthorized'\s*\},\s*\{\s*status:\s*401\s*\}\s*\)/)
  })

  it('redirects unauthenticated non-API requests to /login', () => {
    expect(proxySrc).toMatch(/NextResponse\.redirect\(new URL\('\/login'/)
  })

  it('explicitly allow-lists public mall data APIs (weather, events, departures, parking, transport, demographics, floorplan, mall, ideapark)', () => {
    for (const route of [
      '/api/weather',
      '/api/events',
      '/api/departures',
      '/api/parking',
      '/api/transport',
      '/api/demographics',
      '/api/floorplan',
      '/api/mall/',
      '/api/ideapark',
    ]) {
      expect(proxySrc).toContain(`'${route}'`)
    }
  })
})

// ─── Layer 2b: text-snapshot guard on auth.ts (invariants the
// proxy and route handlers depend on) ────────────────────────────

describe('src/auth.ts — invariants the rest of the system relies on', () => {
  it('uses JWT session strategy with 8h max age', () => {
    expect(authSrc).toMatch(/strategy:\s*'jwt'/)
    expect(authSrc).toMatch(/maxAge:\s*60\s*\*\s*60\s*\*\s*8/)
  })

  it('locks accounts after 5 failed login attempts', () => {
    expect(authSrc).toMatch(/attempts\s*>=\s*5/)
  })

  it('lockout duration is 15 minutes', () => {
    expect(authSrc).toMatch(/15\s*\*\s*60\s*\*\s*1000/)
  })

  it('resets failedLoginAttempts and clears lockedUntil on successful login', () => {
    expect(authSrc).toMatch(/failedLoginAttempts:\s*0/)
    expect(authSrc).toMatch(/lockedUntil:\s*null/)
  })

  it('clears twoFactorVerifiedAt on successful password match (forces fresh 2FA)', () => {
    expect(authSrc).toMatch(/twoFactorVerifiedAt:\s*null/)
  })

  it('jwt callback kills session if user no longer exists in DB', () => {
    // The killswitch: `if (!dbUser) return {} as any`
    expect(authSrc).toMatch(/if\s*\(\s*!\s*dbUser\s*\)/)
    expect(authSrc).toMatch(/return\s*\{\s*\}\s*as\s*any/)
  })

  it('jwt callback re-checks twoFactorVerifiedAt on every request until verified', () => {
    expect(authSrc).toMatch(/!token\.twoFactorVerified/)
    expect(authSrc).toMatch(/twoFactorVerifiedAt/)
  })

  it('credentials provider validates email format and password length >= 6', () => {
    expect(authSrc).toMatch(/z\.string\(\)\.email\(\)/)
    expect(authSrc).toMatch(/z\.string\(\)\.min\(6\)/)
  })
})
