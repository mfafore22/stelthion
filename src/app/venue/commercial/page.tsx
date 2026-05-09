'use client';

import { BadgePercent, HandCoins, ShoppingBag } from 'lucide-react';
import { VenueHero } from '@/components/venue/VenueHero';
import { VenueMetricCard } from '@/components/venue/VenueMetricCard';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { useVenueFocus } from '@/lib/venue/useVenueFocus';

export default function VenueCommercialPage() {
  const venue = useVenueFocus();
  return (
    <VenuePageChrome>
      <VenueHero
        venue={venue}
        title="Commercial activation"
        body="Turn event demand into measurable revenue actions for hospitality, sponsorship, F&B, merchandise, and repeat attendance."
      />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <VenueMetricCard icon={HandCoins} label="Hospitality" value="Premium yield" hint="Suite, club and sponsor inventory are planned by event type and guest segment." />
        <VenueMetricCard icon={ShoppingBag} label="Merch and F&B" value="Demand waves" hint="Offers and staffing follow arrival, halftime, encore and tournament dwell curves." />
        <VenueMetricCard icon={BadgePercent} label="Sponsors" value="Proof of exposure" hint="Activation cards connect footfall, dwell, conversion and audience fit." />
      </section>
    </VenuePageChrome>
  );
}
