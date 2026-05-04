'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from 'lucide-react';
import type {
  MarketDetail,
  PhenomenonSummary,
  SignalOfTheDay,
} from '@stelthion/shoppermind-client-types';
import { MallCard } from '@/components/mall/ui/MallCard';
import { StateBadge } from '@/components/mall/shoppermind/StateBadge';
import { LifecycleContinuumCompact } from '@/components/mall/shoppermind/LifecycleContinuum';
import { MiniSparkline } from '@/components/mall/shoppermind/MiniSparkline';
import { ShopperMindIcon } from '@/components/mall/shoppermind/ShopperMindIcon';
import { localizePhenomenon, localizeSotdNarrative } from '@/lib/shoppermind/localize';
import { cn } from '@/lib/utils';

interface OverviewResponse {
  configured: boolean;
  marketId: string;
  market: MarketDetail | null;
  phenomena: PhenomenonSummary[];
  signalOfTheDay: SignalOfTheDay | null;
  error?: string;
}

const DEMO_MARKETS = [
  { id: 'helsinki-fi', label: 'Helsinki' },
  { id: 'tampere-fi', label: 'Tampere' },
];

export default function ShopperMindDemoPage() {
  const { t } = useTranslation('mall');
  const [marketId, setMarketId] = useState('helsinki-fi');
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setFetching(true);
    });
    fetch(`/api/demo/shoppermind?marketId=${encodeURIComponent(marketId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  return (
    <div className="min-h-screen bg-bo-neutral-50">
      <header className="h-[72px] bg-bo-glass border-b-2 border-bo-neutral-300/60 backdrop-blur-xl flex items-center justify-between px-8 shadow-bo-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bo-primary-100 flex items-center justify-center">
            <ShopperMindIcon className="h-7 w-7" />
          </div>
          <span className="font-semibold text-bo-neutral-950 text-lg tracking-tight">
            {t('shoppermind.title')}
          </span>
          <span className="text-xs font-medium bg-bo-primary-100 text-bo-primary-700 px-2 py-0.5 rounded-full border border-bo-primary-200 ml-1 uppercase tracking-wider">
            {t('shoppermind.demo.badge')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-bo-neutral-100 rounded-lg p-1 gap-1">
            {DEMO_MARKETS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMarketId(m.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  marketId === m.id
                    ? 'bg-white text-bo-neutral-950 shadow-bo-sm'
                    : 'text-bo-neutral-500 hover:text-bo-neutral-800',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <a
            href="mailto:sales@stelthion.com"
            className="flex items-center gap-2 px-4 py-2 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-900 transition-colors shadow-bo-md"
          >
            <Sparkles className="w-4 h-4" />
            {t('shoppermind.demo.getAccess')}
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
              {data?.market?.displayName ??
                DEMO_MARKETS.find((m) => m.id === marketId)?.label ??
                marketId}
            </h1>
            <p className="text-sm text-bo-neutral-500">
              {data?.market?.industryFocus ?? t('shoppermind.demo.defaultFocus')}
            </p>
          </div>
        </div>

        {fetching && (
          <div className="text-sm text-bo-neutral-400 animate-pulse">
            {t('shoppermind.demo.loading')}
          </div>
        )}

        {!fetching && data && !data.configured && (
          <div className="rounded-xl border-2 border-bo-warning/30 bg-bo-warning-light/40 p-6 text-sm text-bo-warning-dark backdrop-blur-xl">
            <div className="font-medium mb-1">{t('shoppermind.demo.notSeededTitle')}</div>
            <div className="text-bo-warning-dark/80">
              {t('shoppermind.demo.notSeededBody', {
                command: 'npx tsx services/shoppermind/scripts/seed-demo.ts',
              })}
            </div>
          </div>
        )}

        {!fetching && data?.configured && (
          <>
            <SignalOfTheDayCard sotd={data.signalOfTheDay} />

            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-bo-neutral-950 uppercase tracking-wider">
                  {t('shoppermind.grid.topTrends')}
                </h2>
                <span className="text-xs text-bo-neutral-400">
                  {t('shoppermind.grid.tracked', { count: data.phenomena.length })}
                </span>
              </div>
              <PhenomenaGrid phenomena={data.phenomena} />
            </div>
          </>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-bo-accent to-bo-accent-dark p-8 text-white flex items-center justify-between gap-6 shadow-bo-lg">
          <div>
            <h2 className="text-xl font-semibold mb-1 tracking-tight">
              {t('shoppermind.demo.ctaTitle')}
            </h2>
            <p className="text-bo-accent-light text-sm">{t('shoppermind.demo.ctaBody')}</p>
          </div>
          <a
            href="mailto:sales@stelthion.com"
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-bo-accent-dark font-semibold text-sm rounded-xl hover:bg-bo-neutral-100 transition-colors shadow-bo-md"
          >
            {t('shoppermind.demo.bookDemo')}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}

function SignalOfTheDayCard({ sotd }: { sotd: SignalOfTheDay | null }) {
  const { t, i18n } = useTranslation('mall');
  if (!sotd) {
    return (
      <MallCard variant="glass" padding="md">
        <div className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-2 font-medium">
          {t('shoppermind.signalOfTheDay.title')}
        </div>
        <div className="text-sm text-bo-neutral-500">{t('shoppermind.signalOfTheDay.empty')}</div>
      </MallCard>
    );
  }
  const narrative = localizeSotdNarrative(sotd, i18n.language);
  return (
    <MallCard variant="glass" padding="md">
      <div className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-2 font-medium">
        {t('shoppermind.signalOfTheDay.title')} · {sotd.date.slice(0, 10)}
      </div>
      <p className="text-bo-neutral-900 leading-relaxed whitespace-pre-wrap">{narrative}</p>
    </MallCard>
  );
}

function PhenomenaGrid({ phenomena }: { phenomena: PhenomenonSummary[] }) {
  const { t } = useTranslation('mall');
  if (phenomena.length === 0) {
    return (
      <MallCard variant="glass" padding="md">
        <div className="text-sm text-bo-neutral-500">{t('shoppermind.grid.empty')}</div>
      </MallCard>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {phenomena.map((p) => (
        <PhenomenonCard key={p.id} phenomenon={p} />
      ))}
    </div>
  );
}

function PhenomenonCard({ phenomenon }: { phenomenon: PhenomenonSummary }) {
  const { t, i18n } = useTranslation('mall');
  const localized = localizePhenomenon(phenomenon, i18n.language);
  const teaser = (localized.parsed.retailerImpact ?? localized.parsed.summary).slice(0, 140);
  return (
    <MallCard variant="glass" padding="md" className="h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-bo-neutral-950 leading-snug tracking-tight">
          {localized.label}
        </h3>
        <StateBadge state={phenomenon.state} />
      </div>
      <div className="mb-3">
        {phenomenon.recentScores && phenomenon.recentScores.length >= 2 ? (
          <MiniSparkline scores={phenomenon.recentScores} height={28} />
        ) : (
          <div className="h-[28px]" />
        )}
      </div>
      <LifecycleContinuumCompact state={phenomenon.state} className="mb-3" />
      {teaser && (
        <p className="text-sm text-bo-neutral-700 line-clamp-2 mb-3 leading-relaxed">{teaser}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-bo-neutral-400 pt-3 border-t border-bo-neutral-200/60">
        <span>
          {t('shoppermind.grid.score')}{' '}
          <strong className="text-bo-neutral-900">
            {phenomenon.compositeScore.toFixed(2)}
          </strong>
        </span>
        {phenomenon.categories?.slice(0, 2).map((c) => (
          <span
            key={c}
            className="px-1.5 py-0.5 bg-bo-neutral-100 rounded text-bo-neutral-500 border border-bo-neutral-200"
          >
            {c}
          </span>
        ))}
      </div>
    </MallCard>
  );
}
