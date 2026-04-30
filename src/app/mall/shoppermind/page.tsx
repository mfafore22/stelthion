'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import type { MarketDetail, PhenomenonSummary, SignalOfTheDay } from '@stelthion/shoppermind-client-types';
import { ShopperMindHeader } from '@/components/mall/shoppermind/ShopperMindHeader';
import { MegaScenarioSection } from '@/components/mall/shoppermind/MegaScenarioSection';
import { HorizonSection } from '@/components/mall/shoppermind/HorizonSection';
import { MacroDashboard } from '@/components/mall/shoppermind/MacroDashboard';
import { SignalOfTheDayCard } from '@/components/mall/shoppermind/SignalOfTheDayCard';
import { getMegaScenario, SUPPORTED_COUNTRIES } from '@/lib/shoppermind/megaScenario';
import { groupByHorizon } from '@/lib/shoppermind/horizon';

interface OverviewResponse {
  configured: boolean;
  marketId: string;
  market: MarketDetail | null;
  phenomena: PhenomenonSummary[];
  signalOfTheDay: SignalOfTheDay | null;
  error?: string;
}

const SUPPORTED_SET = new Set<string>(SUPPORTED_COUNTRIES);

export default function ShopperMindPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const { t, i18n } = useTranslation('mall');
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);
  const [country, setCountry] = useState<string>('FI');
  const [selectedMallId, setSelectedMallId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.mallId) return;
    let cancelled = false;
    setFetching(true);
    setError(null);
    setGated(false);
    fetch(`/api/shoppermind/overview?mallId=${encodeURIComponent(user.mallId)}`, { credentials: 'include' })
      .then(async (res) => {
        const body = (await res.json()) as OverviewResponse & { error?: string };
        if (cancelled) return;
        if (res.status === 403 && body.error === 'feature_not_on_plan') { setGated(true); return; }
        if (!res.ok && !body.configured) setError(body.error ?? t('shoppermind.errors.serviceUnavailable'));
        else if (body.error) setError(body.error);
        setData(body);
        if (body.market?.country) setCountry(body.market.country);
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : t('shoppermind.errors.network')); })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [user?.mallId]);

  useEffect(() => {
    if (user?.mallId) setSelectedMallId(user.mallId);
  }, [user?.mallId]);

  const grouped = useMemo(() => groupByHorizon(data?.phenomena ?? []), [data?.phenomena]);
  const megaScenario = useMemo(
    () => getMegaScenario(country, i18n.language, selectedMallId),
    [country, i18n.language, selectedMallId],
  );

  const isSupported = SUPPORTED_SET.has(country);

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
        <ShopperMindHeader country={country} onCountryChange={setCountry} />
        <div className="px-8 max-w-[1600px] mx-auto">
          <div className="py-6 space-y-4">
            {fetching && (
              <div className="text-sm text-bo-neutral-400 animate-pulse">{t('shoppermind.loadingTrends')}</div>
            )}
            {!fetching && gated && <UpgradeBanner />}
            {!fetching && !gated && data && !data.configured && <NotConfigured marketId={data.marketId} />}
            {!fetching && !gated && data?.configured && error && <ErrorBanner message={error} />}
            {!fetching && !gated && data?.configured && !error && (
              <>
                {isSupported && country === 'FI' ? (
                  <MacroDashboard country={country} />
                ) : (
                  <div className="text-xs text-bo-neutral-500 italic">
                    {t('shoppermind.macro.onlyFinland', { defaultValue: 'Live-makroindikaattorit saatavilla vain Suomesta toistaiseksi.' })}
                  </div>
                )}
                {megaScenario && (
                  <MegaScenarioSection
                    scenario={megaScenario}
                    selectedMallId={selectedMallId}
                    onSelectMall={setSelectedMallId}
                  />
                )}
                {!megaScenario && (
                  <div className="rounded-lg border border-dashed border-bo-neutral-300 bg-bo-neutral-50/50 p-6 text-sm text-bo-neutral-600">
                    {t('shoppermind.markets.noScenario', { defaultValue: 'Tämän markkinan päänäkymää kerätään parhaillaan.' })}
                  </div>
                )}
                {isSupported ? (
                  <>
                    <HorizonSection horizon="short" phenomena={grouped.short} mallId={user?.mallId ?? null}
                                    defaultOpen topSlot={<SignalOfTheDayCard sotd={data.signalOfTheDay} />} />
                    <HorizonSection horizon="medium" phenomena={grouped.medium} mallId={user?.mallId ?? null} />
                    <HorizonSection horizon="long" phenomena={grouped.long} mallId={user?.mallId ?? null} />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-bo-neutral-300 bg-bo-neutral-50/50 p-6 text-sm text-bo-neutral-600">
                    {t('shoppermind.markets.horizonsComingSoon', { defaultValue: 'Aikajaksokohtaiset trendit saatavilla pian.' })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
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
          envVar1: 'SHOPPERMIND_SERVICE_URL', envVar2: 'SHOPPERMIND_SERVICE_TOKEN', marketId,
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
