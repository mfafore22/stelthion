'use client';

import React, { useEffect } from 'react';
import i18n from '@/lib/i18n';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import {SessionProvider} from '@/contexts/SessionContext';
import { MallConciergeWrapper } from '@/components/mall/shell/MallConciergeWrapper';

interface MallLayoutProps {
  children: React.ReactNode;
}

export default function MallLayout({ children }: MallLayoutProps) {
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
          {children}
        </MallConciergeWrapper>
      </SessionProvider>
    </NextAuthSessionProvider>
  );
}