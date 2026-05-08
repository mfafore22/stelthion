'use client';

import React, { useEffect } from 'react';
import i18n from '@/lib/i18n';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from '@/contexts/SessionContext';
import { MallConciergeWrapper } from '@/components/mall/shell/MallConciergeWrapper';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  useEffect(() => {
    const saved = localStorage.getItem('stelthion-language');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);

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