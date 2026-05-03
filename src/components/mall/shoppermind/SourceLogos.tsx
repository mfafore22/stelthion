'use client';

import type {
  ContributingSource,
  SourceAuthority,
  SourceType,
} from '@stelthion/shoppermind-client-types';
import { useTranslation } from 'react-i18next';
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
  short: string;
  active: string;
}

const META: Record<SourceType, BadgeMeta> = {
  STATFIN: { short: 'SF', active: 'bg-emerald-600 text-white' },
  FRED: { short: 'FR', active: 'bg-emerald-700 text-white' },
  TRADE_PUB: { short: 'TP', active: 'bg-emerald-500 text-white' },
  RSS: { short: 'RS', active: 'bg-orange-500 text-white' },
  GOOGLE_TRENDS: { short: 'GT', active: 'bg-blue-500 text-white' },
  REDDIT: { short: 'RD', active: 'bg-rose-500 text-white' },
  X: { short: 'X', active: 'bg-bo-neutral-900 text-white' },
  TIKTOK: { short: 'TT', active: 'bg-fuchsia-600 text-white' },
};

function classify(type: SourceType): SourceAuthority {
  return AUTHORITATIVE.has(type) ? 'authoritative' : 'opinion';
}

function tooltip(
  active: ContributingSource | undefined,
  type: SourceType,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const label = t(`shoppermind.sourceBadges.names.${type}`);
  if (!active) return t('shoppermind.sourceBadges.inactive', { source: label });
  const date = new Date(active.lastSignalAt);
  const last = isNaN(date.getTime()) ? '-' : date.toISOString().slice(0, 10);
  return t('shoppermind.sourceBadges.active', {
    source: label,
    count: active.signalCount,
    last,
  });
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
  const { t } = useTranslation('mall');
  const activeMap = new Map<SourceType, ContributingSource>();
  for (const s of contributingSources ?? []) activeMap.set(s.type, s);

  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {ALL_SOURCES.map((type) => {
        const active = activeMap.get(type);
        const m = META[type];
        const title = tooltip(active, type, t);
        const isAuthoritative = classify(type) === 'authoritative';
        const isActive = !!active;
        return (
          <span
            key={type}
            title={title}
            aria-label={title}
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
