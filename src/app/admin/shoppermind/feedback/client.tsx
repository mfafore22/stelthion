'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackFilters } from './FeedbackFilters';
import { FeedbackAggregatesStrip } from './FeedbackAggregates';
import { FeedbackTable } from './FeedbackTable';
import type { DaysFilter, FeedbackListData, VerdictFilter } from './types';

function buildSinceISO(days: DaysFilter): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function ShopperMindFeedbackClient() {
  const [data, setData] = useState<FeedbackListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phenomenonId, setPhenomenonId] = useState('');
  const [verdict, setVerdict] = useState<VerdictFilter>('all');
  const [days, setDays] = useState<DaysFilter>(30);

  useEffect(() => {
    const params = new URLSearchParams({ since: buildSinceISO(days), limit: '500' });
    if (phenomenonId) params.set('phenomenonId', phenomenonId);
    if (verdict !== 'all') params.set('verdict', verdict);
    setLoading(true);
    fetch(`/api/admin/shoppermind/feedback?${params}`)
      .then((res) => res.json())
      .then((body: FeedbackListData) => setData(body))
      .catch((err) => setData({ configured: true, rows: [], aggregates: [], error: String(err) }))
      .finally(() => setLoading(false));
  }, [phenomenonId, verdict, days]);

  const phenomenaForFilter = useMemo(() => data?.aggregates ?? [], [data]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">ShopperMind Feedback</h1>
      </div>

      {data && !data.configured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 mb-4">
          ShopperMind service is not configured (missing SHOPPERMIND_SERVICE_URL / TOKEN).
        </div>
      )}
      {data?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          {data.error}
        </div>
      )}

      <FeedbackFilters
        phenomena={phenomenaForFilter}
        phenomenonId={phenomenonId}
        setPhenomenonId={setPhenomenonId}
        verdict={verdict}
        setVerdict={setVerdict}
        days={days}
        setDays={setDays}
      />

      {loading ? (
        <p className="p-6 text-sm text-bo-neutral-400">Loading…</p>
      ) : (
        <>
          <FeedbackAggregatesStrip aggregates={data?.aggregates ?? []} />
          <FeedbackTable rows={data?.rows ?? []} />
        </>
      )}
    </div>
  );
}
