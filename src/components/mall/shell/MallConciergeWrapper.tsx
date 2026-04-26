/**
 * Mall Concierge Wrapper
 * Wraps the Concierge with user session data and mallId.
 */

'use client';

import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useParams } from 'next/navigation';
import { ConciergeProvider, ConciergePanel } from '@/components/concierge';
import { ViewContextProvider } from '@/lib/shoppermind/view-context';

const CONCIERGE_ENABLED = true;

interface MallConciergeWrapperProps {
  children: React.ReactNode;
}

export function MallConciergeWrapper({ children }: MallConciergeWrapperProps) {
  const { user, loading } = useSession();
  const params = useParams();

  const mallId = (params?.mallId as string) || 'ideapark-lempaala';

  if (!CONCIERGE_ENABLED) {
    return <>{children}</>;
  }

  return (
    <ViewContextProvider>
      <ConciergeProvider
        tenantId={user?.mallId || 'default'}
        userId={user?.userId || 'anonymous'}
        mallId={mallId}
      >
        {!loading && user && <ConciergePanel />}
        {children}
      </ConciergeProvider>
    </ViewContextProvider>
  );
}
