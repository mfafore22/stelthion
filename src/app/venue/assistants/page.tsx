'use client';

import { HandPlatter, MessageCircle } from 'lucide-react';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';
import { VenueHero } from '@/components/venue/VenueHero';
import { VenuePageChrome } from '@/components/venue/shell/VenuePageChrome';
import { VENUE_ASSISTANTS } from '@/lib/venue/assistants';
import { useVenueFocus } from '@/lib/venue/useVenueFocus';

export default function VenueAssistantsPage() {
  const venue = useVenueFocus();
  const concierge = useConciergeOptional();
  return (
    <VenuePageChrome>
      <VenueHero
        venue={venue}
        title="Venue assistants"
        body="Role-specific assistants for venue directors, event operations, commercial teams, fan experience, safety, and transport planning."
      />
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {VENUE_ASSISTANTS.map((item) => (
          <article key={item.id} className="bo-surface-subtle bo-surface-hover flex min-h-[260px] flex-col rounded-xl border border-bo-neutral-200/70 p-5 shadow-bo-glass">
            <HandPlatter className="mb-4 h-7 w-7 text-bo-primary-700" />
            <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-bo-neutral-600">{item.body}</p>
            <button
              onClick={() => {
                concierge?.openPanel();
                concierge?.sendMessage(`Act as ${item.title} for ${venue.name}. Give me the next useful demo action.`);
              }}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full border border-bo-neutral-200 bg-white/70 px-3 py-2 text-xs font-semibold text-bo-neutral-800 shadow-bo-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-bo-primary-300 hover:bg-bo-primary-50"
            >
              <MessageCircle className="h-4 w-4" />
              Start chat
            </button>
          </article>
        ))}
      </section>
    </VenuePageChrome>
  );
}
