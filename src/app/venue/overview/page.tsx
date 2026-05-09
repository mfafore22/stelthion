'use client';

import { CalendarDays, RadioTower, ShieldCheck, Users } from 'lucide-react';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { VenueHero } from '@/components/venue/VenueHero';
import { VenueMetricCard } from '@/components/venue/VenueMetricCard';
import { VenueEventCard } from '@/components/venue/VenueEventCard';
import { useVenueFocus } from '@/lib/venue/useVenueFocus';

export default function VenueOverviewPage() {
  const venue = useVenueFocus();
  return (
    <VenuePageChrome>
      <VenueHero
        venue={venue}
        title="Arena operating overview"
        body="A venue-specific command view for event demand, live operations, commercial yield, and fan experience across Finland, UAE, and Singapore."
      />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <VenueMetricCard icon={Users} label="Capacity" value={venue.capacity.toLocaleString('en-US')} hint="Used for event load, egress and staffing simulation." />
        <VenueMetricCard icon={CalendarDays} label="Annual events" value={`${venue.annualEvents ?? 0}`} hint="Demo schedule ready for calendar and event-type benchmarking." />
        <VenueMetricCard icon={RadioTower} label="Sensor readiness" value="Live-ready" hint="Zones are separated for crowd, queue, retail and transport feeds." />
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {venue.events.map((event) => <VenueEventCard key={event.id} event={event} />)}
      </section>
      <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-bo-primary-700" />
          <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">Operational zones</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {venue.zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-bo-neutral-200/70 bg-white/55 p-4">
              <div className="text-sm font-semibold text-bo-neutral-950">{zone.name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.12em] text-bo-neutral-500">{zone.category}</div>
            </div>
          ))}
        </div>
      </section>
    </VenuePageChrome>
  );
}
