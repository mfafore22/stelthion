'use client';

import { useConciergeOptional } from '@/components/concierge/ConciergeContext';
import { getVenueDemo } from './demoData';

export function useVenueFocus() {
  const concierge = useConciergeOptional();
  return getVenueDemo(concierge?.mallId);
}
