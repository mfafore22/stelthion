import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session?.user

  const pathname = nextUrl.pathname

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth')

  const is2FARoute =
    pathname === '/two-factor' ||
    pathname.startsWith('/api/two-factor')

  const isStaticRoute =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg')

  if (isStaticRoute) return NextResponse.next()

  if (isPublicRoute) {
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/two-factor', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    if (is2FARoute) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    if (pathname.startsWith('/api/weather') ||
        pathname.startsWith('/api/events') ||
        pathname.startsWith('/api/departures') ||
        pathname.startsWith('/api/parking') ||
        pathname.startsWith('/api/transport') ||
        pathname.startsWith('/api/demographics') ||
        pathname.startsWith('/api/floorplan') ||
        pathname.startsWith('/api/mall/') ||
        pathname.startsWith('/api/ideapark')) {
      return NextResponse.next()
    }
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (is2FARoute) return NextResponse.next()

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)'],
}