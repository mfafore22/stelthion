'use client';

import { Activity, BadgeCheck, Route, TrendingUp } from 'lucide-react';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { VenueHero } from '@/components/venue/VenueHero';
import { VenueMetricCard } from '@/components/venue/VenueMetricCard';
import { buildVenueSignal, venueOpportunityRows } from '@/lib/venue/insights';
import { useVenueFocus } from '@/lib/venue/useVenueFocus';

export default function VenueMindPage() {
  const venue = useVenueFocus();
  return (
    <VenuePageChrome>
      <VenueHero
        venue={venue}
        title="VenueMind signal board"
        body="VenueMind connects event calendars, crowd movement, transport, concessions, sponsorship, and safety into one operating signal layer."
      />
      <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bo-neutral-500">Signal of the month</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-bo-neutral-950">Operate the event as one linked journey</h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-bo-neutral-700">{buildVenueSignal(venue)}</p>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <VenueMetricCard icon={Activity} label="Crowd flow" value="Arrival + egress" hint="Live curve slots are ready for sensor and ticket-scan feeds." />
        <VenueMetricCard icon={TrendingUp} label="Revenue" value="Per attendee" hint="Tracks F&B, merch, hospitality and sponsor activation by event type." />
        <VenueMetricCard icon={BadgeCheck} label="Trust" value="Evidence-led" hint="Every signal keeps source, freshness, owner and confidence visible." />
      </section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {venueOpportunityRows(venue).map((row) => (
          <article key={row.label} className="bo-surface-subtle bo-surface-hover rounded-xl border border-bo-neutral-200/70 p-4 shadow-bo-glass">
            <Route className="mb-3 h-5 w-5 text-bo-primary-700" />
            <h3 className="text-base font-semibold text-bo-neutral-950">{row.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-bo-neutral-600">{row.value}</p>
          </article>
        ))}
      </section>
    </VenuePageChrome>
  );
}
