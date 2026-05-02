'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PropertyActionsResponse, PhenomenonSummary, SignalOfTheDay } from '@stelthion/shoppermind-client-types';
import type { Horizon } from '@/lib/shoppermind/horizon';
import type { CuratedTrendResolved, MallActions, MegaScenarioResolved } from '@/lib/shoppermind/megaScenario';
import { CompetitorBenchmarkPanel } from './CompetitorBenchmarkPanel';
import { CuratedTrendStrip } from './CuratedTrendStrip';
import { DecisionSupportPanel } from './DecisionSupportPanel';
import { EmptyTabState } from './EmptyTabState';
import { HorizonSection } from './HorizonSection';
import { MegaScenarioSection } from './MegaScenarioSection';
import { PropertySegmentedSelector } from './PropertySegmentedSelector';
import { PropertyActionBoard } from './PropertyActionBoard';
import { SignalOfTheDayCard } from './SignalOfTheDayCard';

export type ShopperMindTab = 'overview' | 'actions' | 'trends' | 'competitors' | 'decision-support';
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
          <MegaScenarioSection scenario={scenario} />
        ) : (
          <EmptyTabState title={t('shoppermind.tabs.overview')} body={t('shoppermind.markets.noScenario')} />
        )}
      </div>
    );
  }

  if (activeTab === 'actions') {
    return (
      <div role="tabpanel" aria-labelledby="shoppermind-tab-actions" className="space-y-4">
        <PropertyActionBoard
          data={selectedActionSet?.actions ?? actions}
          propertyOptions={actionOptions}
          selectedPropertyId={actionMallId}
          onSelectProperty={handleActionMallChange}
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
            <PropertySegmentedSelector
              label={t('shoppermind.actions.selectProperty')}
              options={trendOptions}
              value={trendMallId}
              onChange={handleTrendMallChange}
            />
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
        <CompetitorBenchmarkPanel scenario={scenario} benchmarks={competitorBenchmarks} />
      </div>
    );
  }

  return (
    <div role="tabpanel" aria-labelledby="shoppermind-tab-decision-support" className="space-y-4">
      <DecisionSupportPanel scenario={scenario} actions={actions} trendCount={trendCount} />
    </div>
  );
}
