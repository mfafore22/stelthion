'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PropertyActionsResponse, PhenomenonSummary, SignalOfTheDay } from '@stelthion/shoppermind-client-types';
import type { Horizon } from '@/lib/shoppermind/horizon';
import type { ShopperMindMarketCapabilities } from '@/lib/shoppermind/marketCapabilities';
import type { CuratedTrendResolved, MallActions, MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { CompetitorBenchmarkPanel } from './CompetitorBenchmarkPanel';
import { CuratedTrendStrip } from './CuratedTrendStrip';
import { DecisionSupportPanel } from './DecisionSupportPanel';
import { EmptyTabState } from './EmptyTabState';
import { HorizonSection } from './HorizonSection';
import { MarketLessonsPanel } from './MarketLessonsPanel';
import { MegaScenarioSection } from './MegaScenarioSection';
import { PropertySegmentedSelector } from './PropertySegmentedSelector';
import { PropertyActionBoard } from './PropertyActionBoard';
import { SignalOfTheDayCard } from './SignalOfTheDayCard';
import type { ScenarioPathId } from './PathReferenceText';

export type ShopperMindTab = 'overview' | 'actions' | 'trends' | 'competitors' | 'decision-support' | 'market-lessons';
export type MallTrendSet = {
  mallId: string;
  mallName: string;
  curated: Record<Horizon, CuratedTrendResolved[]>;
};
export type MallActionSet = {
  mallId: string;
  mallName: string;
  actions: PropertyActionsResponse | null;
};

export function ShopperMindTabPanels({
  activeTab,
  signal,
  scenario,
  selectedMallId,
  onSelectMall,
  actions,
  actionSets,
  isSupported,
  grouped,
  curated,
  trendSets,
  userMallId,
  selectedMallName,
  competitorBenchmarks,
  capabilities,
  selectedScenarioPathId,
  onSelectScenarioPath,
}: {
  activeTab: ShopperMindTab;
  signal: SignalOfTheDay | null;
  scenario: MegaScenarioResolved | null;
  selectedMallId: string | null;
  onSelectMall: (id: string) => void;
  actions: PropertyActionsResponse | null;
  actionSets: MallActionSet[];
  isSupported: boolean;
  grouped: Record<Horizon, PhenomenonSummary[]>;
  curated: Record<Horizon, CuratedTrendResolved[]>;
  trendSets: MallTrendSet[];
  userMallId: string | null;
  selectedMallName?: string;
  competitorBenchmarks: Array<{ id: string; actions: MallActions }>;
  capabilities: ShopperMindMarketCapabilities;
  selectedScenarioPathId?: ScenarioPathId | null;
  onSelectScenarioPath?: (pathId: ScenarioPathId) => void;
}) {
  const { t } = useTranslation('mall');
  const firstActionMall = actionSets[0]?.mallId ?? selectedMallId;
  const firstTrendMall = trendSets[0]?.mallId ?? selectedMallId;
  const [actionMallId, setActionMallId] = useState<string | null>(firstActionMall);
  const [trendMallId, setTrendMallId] = useState<string | null>(firstTrendMall);
  useEffect(() => {
    if (firstActionMall && !actionSets.some((set) => set.mallId === actionMallId)) {
      queueMicrotask(() => setActionMallId(firstActionMall));
    }
  }, [actionMallId, actionSets, firstActionMall]);
  useEffect(() => {
    if (firstTrendMall && !trendSets.some((set) => set.mallId === trendMallId)) {
      queueMicrotask(() => setTrendMallId(firstTrendMall));
    }
  }, [firstTrendMall, trendMallId, trendSets]);

  const selectedActionSet = actionSets.find((set) => set.mallId === actionMallId);
  const selectedTrendSet = trendSets.find((set) => set.mallId === trendMallId);
  const selectedCurated = selectedTrendSet?.curated ?? curated;
  const trendCount = selectedCurated.short.length + selectedCurated.medium.length + selectedCurated.long.length;
  const actionOptions = useMemo(() => actionSets.map((set) => ({ id: set.mallId, name: set.mallName })), [actionSets]);
  const trendOptions = useMemo(() => trendSets.map((set) => ({ id: set.mallId, name: set.mallName })), [trendSets]);
  const handleActionMallChange = (id: string) => {
    setActionMallId(id);
    onSelectMall(id);
  };
  const handleTrendMallChange = (id: string) => {
    setTrendMallId(id);
    onSelectMall(id);
  };

  if (activeTab === 'overview') {
    return (
      <div role="tabpanel" aria-labelledby="shoppermind-tab-overview" className="space-y-4">
        <SignalOfTheDayCard sotd={signal} />
        {scenario ? (
          <MegaScenarioSection scenario={scenario} selectedPathId={selectedScenarioPathId} />
        ) : (
          <EmptyTabState title={t('shoppermind.tabs.overview')} body={t('shoppermind.markets.noScenario')} />
        )}
      </div>
    );
  }

  if (activeTab === 'actions') {
    if (!capabilities.actionsEnabled) {
      return (
        <div role="tabpanel" aria-labelledby="shoppermind-tab-actions" className="space-y-4">
          <EmptyTabState title={t('shoppermind.tabs.emptyActionsTitle')} body={t('shoppermind.tabs.benchmarkActionsBody')} />
        </div>
      );
    }
    return (
      <div role="tabpanel" aria-labelledby="shoppermind-tab-actions" className="space-y-4">
        <PropertyActionBoard
          data={selectedActionSet?.actions ?? actions}
          propertyOptions={actionOptions}
          selectedPropertyId={actionMallId}
          onSelectProperty={handleActionMallChange}
          onSelectScenarioPath={onSelectScenarioPath}
        />
        {!(selectedActionSet?.actions ?? actions) && (
          <EmptyTabState
            title={t('shoppermind.tabs.emptyActionsTitle')}
            body={t('shoppermind.tabs.emptyActionsBody')}
          />
        )}
      </div>
    );
  }

  if (activeTab === 'trends') {
    return (
      <div role="tabpanel" aria-labelledby="shoppermind-tab-trends" className="space-y-4">
        {isSupported ? (
          <>
            {capabilities.propertySelectorsEnabled && trendOptions.length > 0 && (
              <div className="w-full xl:w-[320px]">
                <PropertySegmentedSelector
                  label={t('shoppermind.actions.selectProperty')}
                  options={trendOptions}
                  value={trendMallId}
                  onChange={handleTrendMallChange}
                />
              </div>
            )}
            {(['short', 'medium', 'long'] as const).map((horizon) => (
              <HorizonSection
                key={horizon}
                horizon={horizon}
                phenomena={grouped[horizon]}
                mallId={trendMallId ?? userMallId}
                defaultOpen={horizon === 'short'}
                curatedCount={selectedCurated[horizon].length}
                topSlot={<CuratedTrendStrip trends={selectedCurated[horizon]} mallName={selectedTrendSet?.mallName ?? selectedMallName} />}
              />
            ))}
          </>
        ) : (
          <EmptyTabState title={t('shoppermind.tabs.trends')} body={t('shoppermind.markets.horizonsComingSoon')} />
        )}
      </div>
    );
  }

  if (activeTab === 'competitors') {
    return (
      <div role="tabpanel" aria-labelledby="shoppermind-tab-competitors" className="space-y-4">
        <CompetitorBenchmarkPanel
          scenario={scenario}
          benchmarks={competitorBenchmarks}
          onSelectScenarioPath={onSelectScenarioPath}
        />
      </div>
    );
  }

  if (activeTab === 'market-lessons') {
    return (
      <div role="tabpanel" aria-labelledby="shoppermind-tab-market-lessons" className="space-y-4">
        <MarketLessonsPanel
          scenario={scenario}
          trends={[...curated.short, ...curated.medium, ...curated.long]}
          benchmarks={competitorBenchmarks}
          onSelectScenarioPath={onSelectScenarioPath}
        />
      </div>
    );
  }

  return (
    <div role="tabpanel" aria-labelledby="shoppermind-tab-decision-support" className="space-y-4">
      <DecisionSupportPanel scenario={scenario} actions={actions} trendCount={trendCount} />
    </div>
  );
}
