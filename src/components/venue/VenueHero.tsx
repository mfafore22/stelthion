import { RadioTower } from 'lucide-react';
import type { VenueDemo } from '@/lib/venue/types';

export function VenueHero({ venue, title, body }: { venue: VenueDemo; title: string; body: string }) {
  return (
    <section className="bo-surface overflow-hidden rounded-2xl border-2 border-bo-primary-200/60 p-0 shadow-bo-glass">
      <div
        className="h-32"
        style={{
          background: `linear-gradient(135deg, ${venue.theme.primary}, ${venue.theme.secondary} 55%, ${venue.theme.accent})`,
        }}
      />
      <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 shadow-bo-sm">
            <RadioTower className="h-6 w-6 text-bo-primary-700" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bo-neutral-500">VenueMind</p>
            <h1 className="text-3xl font-semibold tracking-tight text-bo-neutral-950">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-bo-neutral-700">{body}</p>
          </div>
        </div>
        <div className="rounded-xl border border-bo-neutral-200/60 bg-white/55 px-4 py-3 text-sm text-bo-neutral-700">
          {venue.name} · {venue.city}
        </div>
      </div>
    </section>
  );
}
