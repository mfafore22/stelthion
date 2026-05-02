'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutPanelTop } from 'lucide-react';
import { MallCard } from '@/components/mall/ui/MallCard';
import { getMall } from '@/lib/mall/mallDatabase';
import {
  fetchSpaceSuggestions,
  fetchDemoSpaceSuggestions,
  type FetchMode,
} from '@/lib/space-optimizer/fetcher';
import type {
  DrivingTrendRef,
  SpaceSuggestion,
  SpaceSuggestionAction,
  SpaceSuggestionsResponse,
} from '@/lib/space-optimizer/types';
import { formatDate } from '@/lib/i18n/formatting';
import type { LanguageCode } from '@/lib/i18n/config';
import { SuggestionCard } from './SuggestionCard';
import {
  SuggestionFilterBar,
  type SortMode,
} from './SuggestionFilterBar';
import { FloorplanHighlight } from './FloorplanHighlight';

interface SpaceOptimizerViewProps {
  mallId: string;
  mallNameOverride?: string;
  variant?: 'app' | 'demo';
  mode?: FetchMode | 'demo';
}

export function SpaceOptimizerView({
  mallId,
  mallNameOverride,
  variant = 'app',
  mode = 'live',
}: SpaceOptimizerViewProps) {
  const { t, i18n } = useTranslation('mall');
  const lang = (i18n.language?.split('-')[0] ?? 'en') as LanguageCode;

  const [data, setData] = useState<SpaceSuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<SpaceSuggestionAction | 'ALL'>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('confidence');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!mallId) return;
    const ctrl = new AbortController();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || ctrl.signal.aborted) return;
      setLoading(true);
      setError(null);
      setGated(false);
    });

    const promise =
      mode === 'demo'
        ? fetchDemoSpaceSuggestions(mallId, { signal: ctrl.signal })
        : fetchSpaceSuggestions(mallId, { mode, signal: ctrl.signal });

    promise
      .then((res) => {
        if (!ctrl.signal.aborted) setData(res);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'unknown';
        if (msg === 'feature_not_on_plan') setGated(true);
        else setError(msg);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [mallId, mode]);

  const trendIndex = useMemo(() => {
    const map = new Map<string, DrivingTrendRef>();
    data?.drivingTrends.forEach((trend) => map.set(trend.id, trend));
    return map;
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [] as SpaceSuggestion[];
    let list = data.suggestions.filter((s) => !dismissed.has(s.id));
    if (activeAction !== 'ALL') list = list.filter((s) => s.action === activeAction);
    list = [...list].sort((a, b) => {
      if (sortMode === 'uplift') {
        return (b.projectedUpliftPct ?? -1) - (a.projectedUpliftPct ?? -1);
      }
      if (sortMode === 'lease') {
        const ax = a.leaseEndsOn ? new Date(a.leaseEndsOn).getTime() : Number.POSITIVE_INFINITY;
        const bx = b.leaseEndsOn ? new Date(b.leaseEndsOn).getTime() : Number.POSITIVE_INFINITY;
        return ax - bx;
      }
      return b.confidence - a.confidence;
    });
    return list;
  }, [data, dismissed, activeAction, sortMode]);

  const counts = useMemo(() => {
    const result: Record<SpaceSuggestionAction | 'ALL', number> = {
      ALL: 0,
      EXPAND: 0,
      CONVERT: 0,
      MAINTAIN: 0,
      SUNSET: 0,
    };
    if (!data) return result;
    data.suggestions
      .filter((s) => !dismissed.has(s.id))
      .forEach((s) => {
        result.ALL += 1;
        result[s.action] += 1;
      });
    return result;
  }, [data, dismissed]);

  const mallName = mallNameOverride ?? getMall(mallId)?.name ?? data?.mallName ?? mallId;

  if (gated) {
    return (
      <MallCard variant="glass" padding="lg">
        <div className="text-base font-semibold text-bo-neutral-950 mb-2">
          {t('spaceOptimizer.errors.gated.title')}
        </div>
        <div className="text-sm text-bo-neutral-600">
          {t('spaceOptimizer.errors.gated.body')}
        </div>
      </MallCard>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-bo-primary-100 flex items-center justify-center">
          <LayoutPanelTop className="w-6 h-6 text-bo-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
            {t('spaceOptimizer.title')} · {mallName}
          </h1>
          <p className="text-sm text-bo-neutral-500">
            {data
              ? t('spaceOptimizer.header.summary', {
                  count: data.suggestions.length,
                  zones: data.suggestions.length,
                })
              : t('spaceOptimizer.subtitle')}
            {data && data.drivingTrends.length > 0 && (
              <>
                {' · '}
                {t('spaceOptimizer.header.drivenBy', {
                  count: data.drivingTrends.length,
                })}
              </>
            )}
            {data && (
              <>
                {' · '}
                <span className="text-bo-neutral-400">
                  {t('spaceOptimizer.header.lastRun', {
                    date: formatDate(data.generatedAt, lang, 'medium'),
                  })}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-bo-primary-200 bg-white p-4 shadow-bo-sm">
        <div className="text-sm font-semibold text-bo-neutral-950">
          {t('spaceOptimizer.futureConnection.title')}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-bo-neutral-600">
          {t('spaceOptimizer.futureConnection.body')}
        </p>
      </div>

      {loading && (
        <div className="text-sm text-bo-neutral-400 animate-pulse">
          {t('spaceOptimizer.demo.loading')}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border-2 border-bo-error/30 bg-bo-error-light/40 p-4 text-sm text-bo-error-dark">
          {t('spaceOptimizer.errors.load', { message: error })}
        </div>
      )}

      {!loading && data && data.suggestions.length === 0 && (
        <MallCard variant="glass" padding="lg">
          <div className="text-base font-semibold text-bo-neutral-950 mb-1">
            {t('spaceOptimizer.empty.title')}
          </div>
          <div className="text-sm text-bo-neutral-500">
            {t('spaceOptimizer.empty.body', { mall: mallName })}
          </div>
        </MallCard>
      )}

      {!loading && data && data.suggestions.length > 0 && (
        <>
          <SuggestionFilterBar
            actions={['EXPAND', 'CONVERT', 'MAINTAIN', 'SUNSET']}
            activeAction={activeAction}
            onActionChange={setActiveAction}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            counts={counts}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <FloorplanHighlight
                suggestions={visible}
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {visible.map((s) => (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <SuggestionCard
                      suggestion={s}
                      trendIndex={trendIndex}
                      variant={variant}
                      onDismiss={
                        variant === 'app'
                          ? (id) => setDismissed((d) => new Set(d).add(id))
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
