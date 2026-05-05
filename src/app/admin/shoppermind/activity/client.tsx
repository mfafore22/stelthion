'use client';

import { useEffect, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks';
import { AggregateCard } from './AggregateCard';
import { ActivityTable } from './ActivityTable';
import type { ActivityData } from './types';

export function ShopperMindActivityClient() {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch('/api/admin/shoppermind/activity?days=30')
      .then((res) => res.json())
      .then((body: ActivityData) => { if (!cancelled) setData(body); })
      .catch((error) => {
        if (!cancelled) setData({ configured: true, rows: [], aggregates: emptyAggregates(), error: String(error) });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const labels = {
    empty: t('shopperMindActivity.empty'),
    time: t('shopperMindActivity.time'),
    event: t('shopperMindActivity.event'),
    entity: t('shopperMindActivity.entity'),
    mall: t('shopperMindActivity.mall'),
  };

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <MousePointerClick className="h-6 w-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">{t('shopperMindActivity.title')}</h1>
      </div>
      {loading && <p className="p-6 text-sm text-bo-neutral-400">{t('shopperMindActivity.loading')}</p>}
      {!loading && data && !data.configured && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t('shopperMindActivity.notConfigured')}
        </div>
      )}
      {!loading && data?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{data.error}</div>
      )}
      {!loading && data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AggregateCard title={t('shopperMindActivity.events')} items={data.aggregates.events} />
            <AggregateCard title={t('shopperMindActivity.tabs')} items={data.aggregates.tabs} />
            <AggregateCard title={t('shopperMindActivity.categories')} items={data.aggregates.categories} />
            <AggregateCard title={t('shopperMindActivity.entities')} items={data.aggregates.entities} />
            <AggregateCard title={t('shopperMindActivity.malls')} items={data.aggregates.malls} />
          </div>
          <h2 className="mb-3 text-sm font-semibold text-bo-neutral-900">{t('shopperMindActivity.lastEvents')}</h2>
          <ActivityTable rows={data.rows} labels={labels} />
        </>
      )}
    </div>
  );
}

function emptyAggregates() {
  return { events: [], tabs: [], entities: [], categories: [], malls: [] };
}
