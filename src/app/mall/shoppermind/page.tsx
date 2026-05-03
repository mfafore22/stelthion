'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import type {
  MarketDetail,
  PhenomenonSummary,
  PropertyActionsResponse,
  SignalOfTheDay,
} from '@stelthion/shoppermind-client-types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShopperMindHeader } from '@/components/mall/shoppermind/ShopperMindHeader';
import { MacroDashboard } from '@/components/mall/shoppermind/MacroDashboard';
import {
  ShopperMindTabPanels,
  type MallActionSet,
  type MallTrendSet,
  type ShopperMindTab,
} from '@/components/mall/shoppermind/ShopperMindTabPanels';
import type { ScenarioPathId } from '@/components/mall/shoppermind/PathReferenceText';
import {
  getMegaScenario,
  getCuratedTrendsByHorizon,
  SUPPORTED_COUNTRIES,
  type MallActions,
} from '@/lib/shoppermind/megaScenario';
import { groupByHorizon } from '@/lib/shoppermind/horizon';
import {
  getOperatingCountries,
  getShopperMindMarketCapabilities,
} from '@/lib/shoppermind/marketCapabilities';
import { getStaticSignalOfMonth } from '@/lib/shoppermind/staticSignals';
import { buildScenarioActionFallback } from '@/lib/shoppermind/scenarioActionFallback';

interface OverviewResponse {
  configured: boolean;
  marketId: string;
  market: MarketDetail | null;
  phenomena: PhenomenonSummary[];
  signalOfTheDay: SignalOfTheDay | null;
  propertyActions?: PropertyActionsResponse | null;
  error?: string;
}

const SUPPORTED_SET = new Set<string>(SUPPORTED_COUNTRIES);
const SHOPPERMIND_TABS: Array<{ value: ShopperMindTab; labelKey: string; fallback: string }> = [
  { value: 'overview', labelKey: 'shoppermind.tabs.overview', fallback: 'Päänäkymä' },
  { value: 'actions', labelKey: 'shoppermind.tabs.actions', fallback: 'Toimenpiteet' },
  { value: 'trends', labelKey: 'shoppermind.tabs.trends', fallback: 'Trendit' },
  { value: 'competitors', labelKey: 'shoppermind.tabs.competitors', fallback: 'Kilpailijat' },
  { value: 'decision-support', labelKey: 'shoppermind.tabs.decisionSupport', fallback: 'Päätöksen tuki' },
  { value: 'market-lessons', labelKey: 'shoppermind.tabs.marketLessons', fallback: 'Markkinaopit' },
];

function withFallbackSources(
  signal: SignalOfTheDay | null,
  fallback: SignalOfTheDay | null,
): SignalOfTheDay | null {
  if (!signal) return fallback;
  if (signal.contributingSources?.length) return signal;
  return fallback ?? signal;
}

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
  const [activeTab, setActiveTab] = useState<ShopperMindTab>('overview');
  const [selectedScenarioPathId, setSelectedScenarioPathId] = useState<ScenarioPathId | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.mallId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setFetching(true);
        setError(null);
        setGated(false);
      }
    });
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
  }, [user?.mallId, t]);

  useEffect(() => {
    if (!user?.mallId) return;
    queueMicrotask(() => setSelectedMallId(user.mallId));
  }, [user?.mallId]);

  const overviewCountry = data?.market?.country ?? data?.propertyActions?.property.country ?? null;
  const overviewMatchesCountry = !overviewCountry || overviewCountry === country;
  const operatingCountries = useMemo(() => getOperatingCountries(user?.properties), [user?.properties]);
  const capabilities = useMemo(
    () => getShopperMindMarketCapabilities(country, operatingCountries),
    [country, operatingCountries],
  );
  const visibleTabs = useMemo(
    () => SHOPPERMIND_TABS.filter((tab) => {
      if (tab.value === 'actions') return capabilities.actionsEnabled;
      if (tab.value === 'decision-support') return capabilities.decisionSupportEnabled;
      if (tab.value === 'market-lessons') return !capabilities.decisionSupportEnabled;
      return true;
    }),
    [capabilities.actionsEnabled, capabilities.decisionSupportEnabled],
  );
  const grouped = useMemo(
    () => groupByHorizon(overviewMatchesCountry ? (data?.phenomena ?? []) : []),
    [data?.phenomena, overviewMatchesCountry],
  );
  const rawMegaScenario = useMemo(
    () => getMegaScenario(country, i18n.language, selectedMallId),
    [country, i18n.language, selectedMallId],
  );
  const effectiveMallId = useMemo(() => {
    if (!capabilities.propertySelectorsEnabled) return null;
    if (!rawMegaScenario?.perMallOptions.length) return null;
    const selectedIsValid = selectedMallId
      ? rawMegaScenario.perMallOptions.some((option) => option.id === selectedMallId)
      : false;
    return selectedIsValid ? selectedMallId : rawMegaScenario.perMallOptions[0]?.id ?? null;
  }, [capabilities.propertySelectorsEnabled, rawMegaScenario, selectedMallId]);
  const megaScenario = useMemo(
    () => getMegaScenario(country, i18n.language, effectiveMallId),
    [country, i18n.language, effectiveMallId],
  );
  const curated = useMemo(() => ({
    short:  getCuratedTrendsByHorizon(country, i18n.language, 'short',  effectiveMallId),
    medium: getCuratedTrendsByHorizon(country, i18n.language, 'medium', effectiveMallId),
    long:   getCuratedTrendsByHorizon(country, i18n.language, 'long',   effectiveMallId),
  }), [country, i18n.language, effectiveMallId]);
  const selectedMallName = megaScenario?.perMall?.name;
  const ownMallOptions = useMemo(
    () => capabilities.propertySelectorsEnabled
      ? (megaScenario?.perMallOptions ?? []).filter((option) => !option.isCompetitor)
      : [],
    [capabilities.propertySelectorsEnabled, megaScenario?.perMallOptions],
  );
  const competitorBenchmarks = useMemo(() => {
    if (!megaScenario) return [];
    return megaScenario.perMallOptions
      .filter((option) => option.isCompetitor)
      .map((option) => ({
        id: option.id,
        actions: getMegaScenario(country, i18n.language, option.id)?.perMall ?? null,
      }))
      .filter((item): item is { id: string; actions: MallActions } => Boolean(item.actions));
  }, [country, i18n.language, megaScenario]);

  const isSupported = SUPPORTED_SET.has(country);
  const trendSets = useMemo<MallTrendSet[]>(() => {
    return ownMallOptions.map((option) => ({
      mallId: option.id,
      mallName: option.name,
      curated: {
        short: getCuratedTrendsByHorizon(country, i18n.language, 'short', option.id),
        medium: getCuratedTrendsByHorizon(country, i18n.language, 'medium', option.id),
        long: getCuratedTrendsByHorizon(country, i18n.language, 'long', option.id),
      },
    }));
  }, [country, i18n.language, ownMallOptions]);
  const fallbackPropertyActions = useMemo(
    () => {
      if (!capabilities.actionsEnabled) return null;
      return buildScenarioActionFallback({
        scenario: megaScenario,
        benchmarks: competitorBenchmarks,
        marketId: data?.marketId ?? `${country.toLowerCase()}-demo`,
        country,
        trendIds: [...curated.short, ...curated.medium, ...curated.long].map((trend) => trend.id),
      });
    },
    [capabilities.actionsEnabled, country, curated.long, curated.medium, curated.short, data?.marketId, megaScenario, competitorBenchmarks],
  );
  const servicePropertyActions = overviewMatchesCountry && capabilities.actionsEnabled ? (data?.propertyActions ?? null) : null;
  const activePropertyActions = servicePropertyActions?.recommendations?.length
    ? servicePropertyActions
    : fallbackPropertyActions;
  const actionSets = useMemo<MallActionSet[]>(() => {
    if (!capabilities.actionsEnabled) return [];
    return ownMallOptions.map((option) => {
      const mallScenario = getMegaScenario(country, i18n.language, option.id);
      const mallCurated = {
        short: getCuratedTrendsByHorizon(country, i18n.language, 'short', option.id),
        medium: getCuratedTrendsByHorizon(country, i18n.language, 'medium', option.id),
        long: getCuratedTrendsByHorizon(country, i18n.language, 'long', option.id),
      };
      const trendIds = [...mallCurated.short, ...mallCurated.medium, ...mallCurated.long].map((trend) => trend.id);
      const fallbackActions = buildScenarioActionFallback({
        scenario: mallScenario,
        benchmarks: competitorBenchmarks,
        marketId: data?.marketId ?? `${country.toLowerCase()}-demo`,
        country,
        trendIds,
      });
      const serviceActions = servicePropertyActions?.property.id === option.id ? servicePropertyActions : null;
      return {
        mallId: option.id,
        mallName: option.name,
        actions: serviceActions?.recommendations?.length ? serviceActions : fallbackActions,
      };
    });
  }, [capabilities.actionsEnabled, competitorBenchmarks, country, data?.marketId, i18n.language, ownMallOptions, servicePropertyActions]);
  const fallbackSignalOfTheDay = getStaticSignalOfMonth(country);
  const activeSignalOfTheDay = overviewMatchesCountry
    ? withFallbackSources(data?.signalOfTheDay ?? null, fallbackSignalOfTheDay)
    : fallbackSignalOfTheDay;

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.value === activeTab)) {
      queueMicrotask(() => setActiveTab('overview'));
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (effectiveMallId && effectiveMallId !== selectedMallId) {
      queueMicrotask(() => setSelectedMallId(effectiveMallId));
    }
  }, [effectiveMallId, selectedMallId]);

  useEffect(() => {
    if (activeTab !== 'overview' || !selectedScenarioPathId) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`shoppermind-path-${selectedScenarioPathId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeTab, selectedScenarioPathId]);

  const handleScenarioPathSelect = (pathId: ScenarioPathId) => {
    setSelectedScenarioPathId(pathId);
    setActiveTab('overview');
  };

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
                {isSupported ? (
                  <MacroDashboard country={country} />
                ) : (
                  <div className="text-xs text-bo-neutral-500 italic">
                    {t('shoppermind.macro.notSupported', { defaultValue: 'Makroindikaattorit eivät ole vielä saatavilla tälle markkinalle.' })}
                  </div>
                )}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ShopperMindTab)} className="space-y-4">
                  <div className="overflow-x-auto pb-1">
                    <TabsList className="min-w-max">
                      {visibleTabs.map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          id={`shoppermind-tab-${tab.value}`}
                          value={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                        >
                          {t(tab.labelKey, { defaultValue: tab.fallback })}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <ShopperMindTabPanels
                    activeTab={activeTab}
                    signal={activeSignalOfTheDay}
                    scenario={megaScenario}
                    selectedMallId={effectiveMallId}
                    onSelectMall={setSelectedMallId}
                    actions={activePropertyActions}
                    actionSets={actionSets}
                    isSupported={isSupported}
                    grouped={grouped}
                    curated={curated}
                    trendSets={trendSets}
                    userMallId={user?.mallId ?? null}
                    selectedMallName={selectedMallName}
                    competitorBenchmarks={competitorBenchmarks}
                    capabilities={capabilities}
                    selectedScenarioPathId={selectedScenarioPathId}
                    onSelectScenarioPath={handleScenarioPathSelect}
                  />
                </Tabs>
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
