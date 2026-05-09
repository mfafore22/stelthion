'use client';

import { CalendarRange } from 'lucide-react';
import { VenueEventCard } from '@/components/venue/VenueEventCard';
import { VenueHero } from '@/components/venue/VenueHero';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { useVenueFocus } from '@/lib/venue/useVenueFocus';

export default function VenueEventsPage() {
  const venue = useVenueFocus();
  return (
    <VenuePageChrome>
      <VenueHero
        venue={venue}
        title="Event calendar intelligence"
        body="Each event becomes a planning object with attendance, event type, commercial intent, zone risks, and post-event learning capture."
      />
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {venue.events.map((event) => <VenueEventCard key={event.id} event={event} />)}
      </section>
      <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-5">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-bo-primary-700" />
          <h2 className="text-lg font-semibold text-bo-neutral-950">Live-ready event process</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {['Forecast demand', 'Assign zone owners', 'Monitor event day', 'Capture learnings'].map((step, index) => (
            <div key={step} className="rounded-xl border border-bo-neutral-200/70 bg-white/55 p-4">
              <div className="mb-2 text-xs font-semibold text-bo-neutral-400">0{index + 1}</div>
              <div className="text-sm font-semibold text-bo-neutral-950">{step}</div>
            </div>
          ))}
        </div>
      </section>
    </VenuePageChrome>
  );
}
