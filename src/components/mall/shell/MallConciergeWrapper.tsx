/**
 * Mall Concierge Wrapper
 * Wraps the Concierge with user session data
 */

'use client';

import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { ConciergeProvider, ConciergePanel } from '@/components/concierge';

interface MallConciergeWrapperProps {
  children: React.ReactNode;
}

export function MallConciergeWrapper({ children }: MallConciergeWrapperProps) {
  const { user, loading } = useSession();

  // Always provide ConciergeProvider to avoid context errors
  // But only render the panel when authenticated
  return (
    <ConciergeProvider
      tenantId={user?.mallId || 'default'}
      userId={user?.userId || 'anonymous'}
      wsUrl={process.env.NEXT_PUBLIC_CONCIERGE_WS_URL}
    >
      {/* Only show Concierge panel when authenticated */}
      {!loading && user && <ConciergePanel />}

      {children}
    </ConciergeProvider>
  );
}
