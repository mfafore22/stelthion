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
import { canonicalizeMallId } from '@/lib/mall/ids';
import { getMallIdentity } from '@/lib/mall/mallIdentity';

const CONCIERGE_ENABLED = true;

interface MallConciergeWrapperProps {
  children: React.ReactNode;
}

export function MallConciergeWrapper({ children }: MallConciergeWrapperProps) {
  const { user, loading } = useSession();
  const params = useParams();

  const routeMallId = typeof params?.mallId === 'string' ? params.mallId : null;
  const mallId = canonicalizeMallId(routeMallId) ?? canonicalizeMallId(user?.mallId) ?? '';
  const identity = mallId ? getMallIdentity(mallId) : null;

  if (!CONCIERGE_ENABLED) {
    return <>{children}</>;
  }

  return (
    <ViewContextProvider>
      <ConciergeProvider
        tenantId={user?.mallId || 'default'}
        userId={user?.userId || 'anonymous'}
        mallId={mallId}
        propertyName={identity?.name ?? user?.mallDisplayName ?? user?.companyName ?? 'your property'}
        propertyLogoUrl={identity?.logo}
      >
        {!loading && user && <ConciergePanel />}
        {children}
      </ConciergeProvider>
    </ViewContextProvider>
  );
}
