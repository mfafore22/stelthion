'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallCard } from '@/components/mall/ui/MallCard';
import type {
  MarketDetail,
  PhenomenonSummary,
  SignalOfTheDay,
} from '@stelthion/shoppermind-client-types';
import { SourceLogos } from '@/components/mall/shoppermind/SourceLogos';
import { MegaScenarioSection } from '@/components/mall/shoppermind/MegaScenarioSection';
import { HorizonSection } from '@/components/mall/shoppermind/HorizonSection';
import { MacroDashboard } from '@/components/mall/shoppermind/MacroDashboard';
import { getMegaScenario } from '@/lib/shoppermind/megaScenario';
import { groupByHorizon } from '@/lib/shoppermind/horizon';
import {
  localizeSotdNarrative,
  localizeSotdSections,
} from '@/lib/shoppermind/localize';

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
  const { t, i18n } = useTranslation('mall');
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

  const grouped = useMemo(
    () => groupByHorizon(data?.phenomena ?? []),
    [data?.phenomena],
  );
  const country = data?.market?.country ?? 'FI';
  const megaScenario = useMemo(
    () => getMegaScenario(country, i18n.language, user?.mallId ?? null),
    [country, i18n.language, user?.mallId],
  );

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
        <div className="p-8 max-w-[1600px] mx-auto space-y-4">
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
              <MacroDashboard country={country} />
              {megaScenario && <MegaScenarioSection scenario={megaScenario} />}
              <HorizonSection
                horizon="short"
                phenomena={grouped.short}
                mallId={user?.mallId ?? null}
                defaultOpen
                topSlot={<SignalOfTheDayCard sotd={data.signalOfTheDay} />}
              />
              <HorizonSection horizon="medium" phenomena={grouped.medium} mallId={user?.mallId ?? null} />
              <HorizonSection horizon="long" phenomena={grouped.long} mallId={user?.mallId ?? null} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Header({ market, marketId }: { market: MarketDetail | null; marketId: string | null }) {
  const { t, i18n } = useTranslation('mall');
  const countryCode = market?.country ?? null;
  const countryLabel = countryCode
    ? t(`shoppermind.countries.${countryCode}`, { defaultValue: countryCode })
    : null;
  const monthLabel = (() => {
    try {
      const formatted = new Intl.DateTimeFormat(i18n.language, {
        month: 'long',
        year: 'numeric',
      }).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return null;
    }
  })();
  const sectionLabel = t('shoppermind.snapshot.section');
  const cadenceLine = [countryLabel, monthLabel, sectionLabel].filter(Boolean).join(' / ');
  const marketLine = market
    ? `${market.displayName} · ${market.industryFocus}`
    : marketId
      ? `${t('shoppermind.marketPrefix')}: ${marketId}`
      : t('shoppermind.noMarket');
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-bo-primary-100 flex items-center justify-center">
        <Image src="/shoppermind-icon.png" alt="" width={28} height={28} className="object-contain" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
          {t('shoppermind.title')}
        </h1>
        {cadenceLine && <p className="text-sm font-medium text-bo-neutral-700">{cadenceLine}</p>}
        <p className="text-xs text-bo-neutral-500">{marketLine}</p>
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
      <MallCard variant="glass" padding="md" className="mb-4">
        <div className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-2 font-medium">
          {t('shoppermind.signalSections.monthly')}
        </div>
        <div className="text-sm text-bo-neutral-500">{t('shoppermind.signalOfTheDay.empty')}</div>
      </MallCard>
    );
  }
  const sections = localizeSotdSections(sotd, i18n.language);
  const narrative = localizeSotdNarrative(sotd, i18n.language);
  const monthLabel = (() => {
    try {
      const d = new Date(sotd.date);
      const formatted = new Intl.DateTimeFormat(i18n.language, {
        month: 'long',
        year: 'numeric',
      }).format(d);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return sotd.date.slice(0, 10);
    }
  })();
  return (
    <MallCard variant="glass" padding="md" className="mb-4">
      <div className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-3 font-medium">
        {t('shoppermind.signalSections.monthly')} · {monthLabel}
      </div>
      {sections ? (
        <SignalSections sections={sections} />
      ) : (
        <p className="text-bo-neutral-900 leading-relaxed whitespace-pre-wrap">{narrative}</p>
      )}
      <div className="mt-5 pt-3 border-t border-bo-neutral-200/60">
        <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 mb-1.5 font-medium">
          {t('shoppermind.sources.label', 'Sources')}
        </div>
        <SourceLogos contributingSources={sotd.contributingSources} />
      </div>
    </MallCard>
  );
}

function SignalSections({ sections }: { sections: ReturnType<typeof localizeSotdSections> }) {
  const { t } = useTranslation('mall');
  if (!sections) return null;
  return (
    <div className="space-y-5">
      {sections.headline && (
        <h3 className="text-lg font-semibold text-bo-neutral-950 leading-snug tracking-tight">
          {sections.headline}
        </h3>
      )}
      {sections.keyFindings && sections.keyFindings.length > 0 && (
        <BulletBlock label={t('shoppermind.signalSections.keyFindings')} items={sections.keyFindings} />
      )}
      {sections.byCity && sections.byCity.length > 0 && (
        <div className="space-y-3">
          {sections.byCity.map((block, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-1.5 font-semibold">
                {t('shoppermind.signalSections.byCity', { city: block.city })}
              </div>
              <p className="text-sm text-bo-neutral-800 leading-relaxed whitespace-pre-wrap">{block.body}</p>
            </div>
          ))}
        </div>
      )}
      {sections.alsoVisible && sections.alsoVisible.length > 0 && (
        <BulletBlock label={t('shoppermind.signalSections.alsoVisible')} items={sections.alsoVisible} />
      )}
      {sections.watching && sections.watching.length > 0 && (
        <BulletBlock label={t('shoppermind.signalSections.watching')} items={sections.watching} />
      )}
    </div>
  );
}

function BulletBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-500 mb-1.5 font-semibold">{label}</div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-bo-neutral-800 leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
