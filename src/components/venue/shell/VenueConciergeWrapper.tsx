'use client';

import { useParams } from 'next/navigation';
import { ConciergePanel, ConciergeProvider } from '@/components/concierge';
import { ViewContextProvider } from '@/lib/shoppermind/view-context';
import { useSession } from '@/contexts/SessionContext';
import { VENUE_DEMOS } from '@/lib/venue/demoData';

export function VenueConciergeWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const params = useParams();
  const routeVenueId = typeof params?.venueId === 'string' ? params.venueId : null;
  const allowed = user?.venues?.length ? user.venues : VENUE_DEMOS.map((venue) => venue.id);
  const venueId = routeVenueId && allowed.includes(routeVenueId)
    ? routeVenueId
    : user?.venueId ?? allowed[0] ?? VENUE_DEMOS[0].id;
  const options = VENUE_DEMOS
    .filter((venue) => allowed.includes(venue.id))
    .map((venue) => ({ id: venue.id, name: venue.name }));
  const venue = VENUE_DEMOS.find((item) => item.id === venueId) ?? VENUE_DEMOS[0];

  return (
    <ViewContextProvider>
      <ConciergeProvider
        mode="venue"
        tenantId={venueId}
        userId={user?.userId || 'anonymous'}
        mallId={venueId}
        mallOptions={options}
        propertyName={venue.name}
      >
        {!loading && user && <ConciergePanel />}
        {children}
      </ConciergeProvider>
    </ViewContextProvider>
  );
}
