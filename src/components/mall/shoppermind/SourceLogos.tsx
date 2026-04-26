'use client';

import type {
  ContributingSource,
  SourceAuthority,
  SourceType,
} from '@stelthion/shoppermind-client-types';
import { cn } from '@/lib/utils';

const ALL_SOURCES: SourceType[] = [
  'STATFIN',
  'FRED',
  'TRADE_PUB',
  'RSS',
  'GOOGLE_TRENDS',
  'REDDIT',
  'X',
  'TIKTOK',
];

const AUTHORITATIVE: ReadonlySet<SourceType> = new Set([
  'STATFIN',
  'FRED',
  'TRADE_PUB',
]);

interface BadgeMeta {
  label: string;
  short: string;
  active: string;
}

const META: Record<SourceType, BadgeMeta> = {
  STATFIN: { label: 'StatFin', short: 'SF', active: 'bg-emerald-600 text-white' },
  FRED: { label: 'FRED', short: 'FR', active: 'bg-emerald-700 text-white' },
  TRADE_PUB: { label: 'Trade press', short: 'TP', active: 'bg-emerald-500 text-white' },
  RSS: { label: 'RSS / News', short: 'RS', active: 'bg-orange-500 text-white' },
  GOOGLE_TRENDS: { label: 'Google Trends', short: 'GT', active: 'bg-blue-500 text-white' },
  REDDIT: { label: 'Reddit', short: 'RD', active: 'bg-rose-500 text-white' },
  X: { label: 'X / Twitter', short: 'X', active: 'bg-bo-neutral-900 text-white' },
  TIKTOK: { label: 'TikTok', short: 'TT', active: 'bg-fuchsia-600 text-white' },
};

function classify(type: SourceType): SourceAuthority {
  return AUTHORITATIVE.has(type) ? 'authoritative' : 'opinion';
}

function tooltip(active: ContributingSource | undefined, type: SourceType): string {
  const m = META[type];
  if (!active) return `${m.label} — not contributing`;
  const date = new Date(active.lastSignalAt);
  const ts = isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10);
  return `${m.label} · ${active.signalCount} signal${active.signalCount === 1 ? '' : 's'} · last ${ts}`;
}

export interface SourceLogosProps {
  contributingSources?: ContributingSource[];
  size?: 'sm' | 'md';
  className?: string;
}

export function SourceLogos({
  contributingSources,
  size = 'sm',
  className,
}: SourceLogosProps) {
  const activeMap = new Map<SourceType, ContributingSource>();
  for (const s of contributingSources ?? []) activeMap.set(s.type, s);

  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {ALL_SOURCES.map((type) => {
        const active = activeMap.get(type);
        const m = META[type];
        const isAuthoritative = classify(type) === 'authoritative';
        const isActive = !!active;
        return (
          <span
            key={type}
            title={tooltip(active, type)}
            aria-label={tooltip(active, type)}
            className={cn(
              dim,
              'rounded-md font-semibold flex items-center justify-center select-none transition',
              isActive
                ? cn(
                    m.active,
                    'ring-1 ring-offset-1 ring-offset-bo-neutral-50',
                    isAuthoritative ? 'ring-amber-400' : 'ring-bo-primary/40',
                  )
                : 'bg-bo-neutral-200/70 text-bo-neutral-400',
            )}
          >
            {m.short}
          </span>
        );
      })}
    </div>
  );
}
