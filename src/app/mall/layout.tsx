'use client';

import React from 'react';
import '@/lib/i18n'; // initialise i18next for mall UI
import { SessionProvider } from '@/contexts/SessionContext';
import { MallConciergeWrapper } from '@/components/mall/shell/MallConciergeWrapper';

interface MallLayoutProps {
  children: React.ReactNode;
}

export default function MallLayout({ children }: MallLayoutProps) {
  return (
    <SessionProvider>
      <MallConciergeWrapper>
        <div className="mall-theme-page min-h-screen bg-mall-neutral-100 text-mall-neutral-900">
          {children}
        </div>
      </MallConciergeWrapper>
    </SessionProvider>
  );
}
