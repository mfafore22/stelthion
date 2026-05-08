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
import { getMall } from '@/lib/mall/mallDatabase';

const CONCIERGE_ENABLED = true;
const CONCIERGE_ACTIVE_MALLS = new Set(['ideapark-lempaala', 'realidea-sello', 'realidea-tripla']);

interface MallConciergeWrapperProps {
  children: React.ReactNode;
}

export function MallConciergeWrapper({ children }: MallConciergeWrapperProps) {
  const { user, loading } = useSession();
  const params = useParams();

  const routeMallId = typeof params?.mallId === 'string' ? params.mallId : null;
  const mallId = canonicalizeMallId(routeMallId) ?? canonicalizeMallId(user?.mallId) ?? '';
  const mallOptions = (user?.properties ?? [])
    .map((id) => canonicalizeMallId(id))
    .filter((id): id is NonNullable<typeof id> => Boolean(id))
    .filter((id, index, ids) => CONCIERGE_ACTIVE_MALLS.has(id) && ids.indexOf(id) === index)
    .map((id) => ({ id, name: getMall(id)?.name ?? getMallIdentity(id, user?.companyName).name }));
  const focusedMallId = mallOptions.some((option) => option.id === mallId)
    ? mallId
    : mallOptions[0]?.id ?? mallId;
  const focusedIdentity = focusedMallId ? getMallIdentity(focusedMallId, user?.companyName) : null;
  const focusedName = mallOptions.find((option) => option.id === focusedMallId)?.name;

  if (!CONCIERGE_ENABLED) {
    return <>{children}</>;
  }

  return (
    <ViewContextProvider>
      <ConciergeProvider
        tenantId={user?.mallId || 'default'}
        userId={user?.userId || 'anonymous'}
        mallId={focusedMallId}
        mallOptions={mallOptions}
        propertyName={focusedName ?? focusedIdentity?.name ?? user?.mallDisplayName ?? user?.companyName ?? 'your property'}
        propertyLogoUrl={focusedIdentity?.logo}
      >
        {!loading && user && <ConciergePanel />}
        {children}
      </ConciergeProvider>
    </ViewContextProvider>
  );
}
