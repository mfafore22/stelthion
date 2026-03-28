/**
 * Mall Concierge Wrapper
 * Wraps the Concierge with user session data
 */

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { ConciergeProvider, ConciergePanel } from '@/components/concierge';

interface MallConciergeWrapperProps {
  children: React.ReactNode;
}

export function MallConciergeWrapper({ children }: MallConciergeWrapperProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';

  // Always provide ConciergeProvider to avoid context errors
  // But only render the panel when authenticated
  return (
    <ConciergeProvider
      tenantId={user?.customerId || 'default'}
      userId={user?.id || 'anonymous'}
      wsUrl={process.env.NEXT_PUBLIC_CONCIERGE_WS_URL}
    >
      {/* Only show Concierge panel when authenticated */}
      {!loading && user && <ConciergePanel />}

      {children}
    </ConciergeProvider>
  );
}
