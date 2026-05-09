'use client';

import { ShieldCheck } from 'lucide-react';
import { VenueHero } from '@/components/venue/VenueHero';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { useVenueFocus } from '@/lib/venue/useVenueFocus';

const CARDS = [
  ['Arrival pressure', 'Gate demand, bag checks, security lanes and station release timing.'],
  ['In-venue friction', 'Queue build-up, concourse dwell, restroom load and wayfinding stress.'],
  ['Safety posture', 'Crowd density, incident notes, steward redeployment and escalation trail.'],
  ['Egress control', 'Exit gate release, taxi and transit queues, car park waves and weather exposure.'],
];

export default function VenueOperationsPage() {
  const venue = useVenueFocus();
  return (
    <VenuePageChrome>
      <VenueHero
        venue={venue}
        title="Operations control"
        body="A live-ready operating layer for event-day decisions across arrivals, crowd movement, staffing, safety, and egress."
      />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {CARDS.map(([title, body]) => (
          <article key={title} className="bo-surface-subtle bo-surface-hover rounded-xl border border-bo-neutral-200/70 p-5 shadow-bo-glass">
            <ShieldCheck className="mb-4 h-6 w-6 text-bo-primary-700" />
            <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-bo-neutral-600">{body}</p>
          </article>
        ))}
      </section>
    </VenuePageChrome>
  );
}
