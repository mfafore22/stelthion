'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CuratedTrendResolved } from '@/lib/shoppermind/megaScenario';
import { MallCard } from '@/components/mall/ui/MallCard';
import { StateBadge } from './StateBadge';
import { MallFormatBadge } from './MallFormatBadge';
import { ConfidencePip } from './ConfidencePip';
import { MallImplicationsPanel } from './MallImplicationsPanel';

interface Props {
  trend: CuratedTrendResolved;
  mallName?: string;
}

export function CuratedTrendCard({ trend, mallName }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('mall');
  return (
    <MallCard variant="glass" padding="md">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-bo-neutral-950 leading-snug tracking-tight text-base">
          {trend.label}
        </h3>
        <StateBadge state={trend.state as never} />
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <MallFormatBadge format={trend.mallFormat} />
        <ConfidencePip score={trend.confidence} />
        <span className="text-[10px] text-bo-neutral-500 italic">
          {t('shoppermind.curatedTrends.marketsNote', { defaultValue: trend.marketsNote })}
        </span>
      </div>
      <p className="text-sm text-bo-neutral-800 leading-relaxed mb-2 line-clamp-3">
        {trend.body}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-[11px] text-bo-primary-700 hover:text-bo-primary-900 inline-flex items-center gap-1"
      >
        {open ? t('shoppermind.section.collapse') : t('shoppermind.section.expand')}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-bo-neutral-200/60 space-y-3">
          <MallImplicationsPanel
            implications={trend.mallImplications}
            opportunitiesFallback={trend.opportunities}
            mallName={mallName}
          />
          {trend.campaigns.length > 0 && (
            <section>
              <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-1.5">
                {t('shoppermind.curatedTrends.campaigns')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trend.campaigns.map((c, i) => (
                  <span key={i} className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-bo-primary-50 border border-bo-primary-200 text-bo-primary-800">
                    {c.name}
                  </span>
                ))}
              </div>
            </section>
          )}
          {trend.sources.length > 0 && (
            <section>
              <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-1">
                {t('shoppermind.section.sources')}
              </div>
              <ul className="space-y-0.5">
                {trend.sources.slice(0, 4).map((s) => (
                  <li key={s.id} className="text-[11px] leading-snug">
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-baseline gap-1 text-bo-primary-700 hover:text-bo-primary-900 underline decoration-bo-primary-200 hover:decoration-bo-primary-700 underline-offset-2">
                      <span className="truncate max-w-[260px]">{s.title}</span>
                      <ExternalLink size={9} />
                    </a>
                    <span className="text-bo-neutral-400 ml-1.5">· {s.publisher}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </MallCard>
  );
}
