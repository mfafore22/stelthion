'use client';

import React from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from '@/contexts/SessionContext';
import { MallConciergeWrapper } from '@/components/mall/shell/MallConciergeWrapper';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  return (
    <NextAuthSessionProvider>
      <SessionProvider>
        <MallConciergeWrapper>
          <div className="mall-theme-page min-h-screen bg-mall-neutral-100 text-mall-neutral-900">
            {children}
          </div>
        </MallConciergeWrapper>
      </SessionProvider>
    </NextAuthSessionProvider>
  );
}