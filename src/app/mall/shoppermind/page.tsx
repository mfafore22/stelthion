'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallCard } from '@/components/mall/ui/MallCard';
import { Brain, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type {
  MarketDetail,
  PhenomenonSummary,
  SignalOfTheDay,
} from '@stelthion/shoppermind-client-types';
import { StateBadge } from '@/components/mall/shoppermind/StateBadge';
import { LifecycleContinuumCompact } from '@/components/mall/shoppermind/LifecycleContinuum';
import { MiniSparkline } from '@/components/mall/shoppermind/MiniSparkline';
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

export default function ShopperMindPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const { t } = useTranslation('mall');
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.mallId) return;
    let cancelled = false;
    setFetching(true);
    setError(null);
    setGated(false);
    fetch(`/api/shoppermind/overview?mallId=${encodeURIComponent(user.mallId)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const body = (await res.json()) as OverviewResponse & { error?: string };
        if (cancelled) return;
        if (res.status === 403 && body.error === 'feature_not_on_plan') {
          setGated(true);
          return;
        }
        if (!res.ok && !body.configured) {
          setError(body.error ?? t('shoppermind.errors.serviceUnavailable'));
        } else if (body.error) {
          setError(body.error);
        }
        setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('shoppermind.errors.network'));
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.mallId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bo-neutral-50">
        <div className="animate-pulse text-bo-neutral-400 text-sm">{t('shoppermind.loading')}</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-bo-neutral-50">
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
          <Header market={data?.market ?? null} marketId={data?.marketId ?? null} />
          {fetching && (
            <div className="text-sm text-bo-neutral-400 animate-pulse">
              {t('shoppermind.loadingTrends')}
            </div>
          )}
          {!fetching && gated && <UpgradeBanner />}
          {!fetching && !gated && data && !data.configured && (
            <NotConfigured marketId={data.marketId} />
          )}
          {!fetching && !gated && data?.configured && error && <ErrorBanner message={error} />}
          {!fetching && !gated && data?.configured && !error && (
            <>
              <SignalOfTheDayCard sotd={data.signalOfTheDay} />
              <PhenomenaGrid phenomena={data.phenomena} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Header({ market, marketId }: { market: MarketDetail | null; marketId: string | null }) {
  const { t } = useTranslation('mall');
  const subtitle = market
    ? `${market.displayName} · ${market.industryFocus}`
    : marketId
      ? `${t('shoppermind.marketPrefix')}: ${marketId}`
      : t('shoppermind.noMarket');
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-bo-primary-100 flex items-center justify-center">
        <Brain className="w-6 h-6 text-bo-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
          {t('shoppermind.title')}
        </h1>
        <p className="text-sm text-bo-neutral-500">{subtitle}</p>
      </div>
    </div>
  );
}

function UpgradeBanner() {
  const { t } = useTranslation('mall');
  return (
    <div className="rounded-xl border-2 border-bo-accent/30 bg-bo-accent-light/40 p-6 text-sm text-bo-accent-dark backdrop-blur-xl">
      <div className="font-medium mb-1">{t('shoppermind.upgrade.title')}</div>
      <div className="text-bo-accent-dark/80">{t('shoppermind.upgrade.body')}</div>
    </div>
  );
}

function NotConfigured({ marketId }: { marketId: string }) {
  const { t } = useTranslation('mall');
  return (
    <div className="rounded-xl border-2 border-bo-warning/30 bg-bo-warning-light/40 p-6 text-sm text-bo-warning-dark backdrop-blur-xl">
      <div className="font-medium mb-1">{t('shoppermind.notConfigured.title')}</div>
      <div className="text-bo-warning-dark/80">
        {t('shoppermind.notConfigured.body', {
          envVar1: 'SHOPPERMIND_SERVICE_URL',
          envVar2: 'SHOPPERMIND_SERVICE_TOKEN',
          marketId,
        })}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  const { t } = useTranslation('mall');
  return (
    <div className="rounded-xl border-2 border-bo-error/30 bg-bo-error-light/40 p-4 text-sm text-bo-error-dark">
      {t('shoppermind.errorBanner', { message })}
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
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-bo-neutral-950 uppercase tracking-wider">
          {t('shoppermind.grid.topTrends')}
        </h2>
        <span className="text-xs text-bo-neutral-400">
          {t('shoppermind.grid.tracked', { count: phenomena.length })}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {phenomena.map((p) => (
          <PhenomenonCard key={p.id} phenomenon={p} />
        ))}
      </div>
    </div>
  );
}

function PhenomenonCard({ phenomenon }: { phenomenon: PhenomenonSummary }) {
  const { t, i18n } = useTranslation('mall');
  const localized = localizePhenomenon(phenomenon, i18n.language);
  const teaser = (localized.parsed.retailerImpact ?? localized.parsed.summary).slice(0, 140);
  const velocity = phenomenon.latestVelocity ?? 0;
  const VelIcon = velocity > 0.02 ? ArrowUpRight : velocity < -0.02 ? ArrowDownRight : Minus;
  const velColor =
    velocity > 0.02
      ? 'text-bo-success-dark bg-bo-success-light border-bo-success/30'
      : velocity < -0.02
        ? 'text-bo-warning-dark bg-bo-warning-light border-bo-warning/30'
        : 'text-bo-neutral-500 bg-bo-neutral-100 border-bo-neutral-200';
  return (
    <Link
      href={`/mall/shoppermind/phenomenon/${encodeURIComponent(phenomenon.id)}`}
      className="block"
    >
      <MallCard variant="glass" padding="md" hover className="h-full">
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
          <p className="text-sm text-bo-neutral-700 line-clamp-2 mb-3 leading-relaxed">
            {teaser}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 text-xs pt-3 border-t border-bo-neutral-200/60">
          <span className="text-bo-neutral-500">
            {t('shoppermind.grid.score')}{' '}
            <strong className="text-bo-neutral-900">
              {phenomenon.compositeScore.toFixed(2)}
            </strong>
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium',
              velColor,
            )}
          >
            <VelIcon className="w-3 h-3" />
            {velocity > 0 ? '+' : ''}
            {velocity.toFixed(2)}
          </span>
        </div>
      </MallCard>
    </Link>
  );
}
