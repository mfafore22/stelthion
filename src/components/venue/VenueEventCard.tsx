import { CalendarDays, Users } from 'lucide-react';
import type { VenueDemoEvent } from '@/lib/venue/types';

export function VenueEventCard({ event }: { event: VenueDemoEvent }) {
  return (
    <article className="bo-surface-subtle bo-surface-hover rounded-xl border border-bo-neutral-200/70 p-4 shadow-bo-glass">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-bo-primary-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-bo-primary-700">
          {event.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-bo-neutral-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-bo-neutral-950">{event.title}</h3>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-bo-neutral-700">
        <Users className="h-4 w-4 text-bo-primary-700" />
        {event.expectedGuests.toLocaleString('en-US')} expected guests
      </div>
      <p className="mt-3 text-sm leading-relaxed text-bo-neutral-600">{event.note}</p>
    </article>
  );
}
