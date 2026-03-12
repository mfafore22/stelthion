'use client';

import React from 'react';
import { SessionProvider } from '@/contexts/SessionContext';
import { MallConciergeWrapper } from '@/components/mall/shell/MallConciergeWrapper';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
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
