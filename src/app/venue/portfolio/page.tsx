'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Landmark, Users } from 'lucide-react';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { VenueMetricCard } from '@/components/venue/VenueMetricCard';
import { useSession } from '@/contexts/SessionContext';
import { VENUE_DEMOS } from '@/lib/venue/demoData';

export default function VenuePortfolioPage() {
  const { user } = useSession();
  const allowed = user?.venues?.length ? user.venues : VENUE_DEMOS.map((venue) => venue.id);
  const venues = VENUE_DEMOS.filter((venue) => allowed.includes(venue.id));
  const capacity = venues.reduce((sum, venue) => sum + venue.capacity, 0);
  const events = venues.reduce((sum, venue) => sum + (venue.annualEvents ?? 0), 0);

  return (
    <VenuePageChrome>
      <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
          <Landmark className="h-4 w-4" />
          Venue operator portfolio
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-bo-neutral-950">
          {user?.companyName || 'Venue operator'}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-bo-neutral-600">
          Manage venues as operator properties: event demand, operating zones,
          commercial yield, risk, and assistant context stay scoped per venue.
        </p>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <VenueMetricCard icon={Landmark} label="Venues" value={`${venues.length}`} hint="Operator-scoped venue properties." />
        <VenueMetricCard icon={Users} label="Combined capacity" value={capacity.toLocaleString('en-US')} hint="Used for event load and staffing scenarios." />
        <VenueMetricCard icon={CalendarDays} label="Annual events" value={`${events}`} hint="Portfolio-level event cadence." />
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {venues.map((venue) => (
          <Link key={venue.id} href="/venue/overview" className="bo-surface bo-surface-hover rounded-2xl border border-bo-neutral-200/70 p-5 shadow-bo-glass">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-bo-neutral-950">{venue.name}</h2>
                <p className="mt-1 text-sm text-bo-neutral-500">{venue.city}, {venue.country}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-bo-neutral-400" />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Capacity" value={venue.capacity.toLocaleString('en-US')} />
              <Stat label="Events" value={`${venue.annualEvents ?? 0}`} />
              <Stat label="Zones" value={`${venue.zones.length}`} />
              <Stat label="Sensors" value={`${venue.zones.filter((zone) => zone.sensorReady).length}`} />
            </dl>
          </Link>
        ))}
      </section>
    </VenuePageChrome>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-bo-neutral-200 bg-white/65 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">{label}</dt>
      <dd className="mt-1 font-semibold text-bo-neutral-950">{value}</dd>
    </div>
  );
}
