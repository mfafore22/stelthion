import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isMallRoute = nextUrl.pathname.startsWith('/mall') && !nextUrl.pathname.startsWith('/mall/login');
      const isTenantRoute = nextUrl.pathname.startsWith('/tenant');
      const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard');
      const isLoginPage = nextUrl.pathname === '/login';
      const is2FAPage = nextUrl.pathname === '/two-factor';
      const isApiRoute = nextUrl.pathname.startsWith('/api');

      // Public routes
      if (isLoginPage || is2FAPage || nextUrl.pathname === '/mall/login') return true;

      // API routes — individual route protection handles auth
      if (isApiRoute) return true;

      // Protected routes need login
      if ((isAdminRoute || isMallRoute || isTenantRoute || isDashboardRoute) && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      // Logged in on home page
      if (nextUrl.pathname === '/' && isLoggedIn) {
        return Response.redirect(new URL('/two-factor', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;