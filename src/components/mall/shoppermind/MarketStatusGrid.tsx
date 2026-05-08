'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import type {
  MarketStatusRow,
  MarketDivergenceVerdict,
} from '@stelthion/shoppermind-client-types';
import { SectionCard } from './SectionCard';
import { StateBadge } from './StateBadge';

interface Response {
  configured: boolean;
  rows: MarketStatusRow[];
  divergence: MarketDivergenceVerdict | null;
  error?: string;
}

export function MarketStatusGrid({ phenomenonId }: { phenomenonId: string }) {
  const { t } = useTranslation('mall');
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(phenomenonId)}/markets`, { credentials: 'include' })
      .then((res) => res.json() as Promise<Response>)
      .then((body) => { if (!cancelled) setData(body); })
      .catch(() => { if (!cancelled) setData({ configured: false, rows: [], divergence: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [phenomenonId]);

  if (loading) {
    return (
      <SectionCard icon={Globe} title={t('shoppermind.markets.gridTitle')} accent="accent">
        <div className="text-xs text-bo-neutral-400 animate-pulse">
          {t('shoppermind.loading')}
        </div>
      </SectionCard>
    );
  }
  if (!data?.configured || !data.rows.length) {
    return (
      <SectionCard icon={Globe} title={t('shoppermind.markets.gridTitle')} accent="accent">
        <div className="text-xs text-bo-neutral-500">{t('shoppermind.markets.empty')}</div>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon={Globe} title={t('shoppermind.markets.gridTitle')} accent="accent">
      {data.divergence?.divergent && (
        <div className="mb-3 rounded-md border border-bo-warning/30 bg-bo-warning-light/40 px-3 py-2 text-xs text-bo-warning-dark">
          {t('shoppermind.markets.divergentCallout')}
        </div>
      )}
      <table className="w-full text-sm" aria-label={t('shoppermind.markets.gridTitle')}>
        <thead>
          <tr className="text-xs uppercase tracking-wider text-bo-neutral-400 border-b border-bo-neutral-200">
            <th scope="col" className="text-left font-medium pb-2 pr-3">
              {t('shoppermind.markets.market')}
            </th>
            <th scope="col" className="text-left font-medium pb-2 pr-3">
              {t('shoppermind.markets.country')}
            </th>
            <th scope="col" className="text-left font-medium pb-2 pr-3">
              {t('shoppermind.markets.state')}
            </th>
            <th scope="col" className="text-right font-medium pb-2">
              {t('shoppermind.markets.compositeScore')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr
              key={row.marketId}
              className="border-b border-bo-neutral-100 last:border-0"
              aria-label={`${row.marketLabel} · ${row.country} · ${row.state}`}
            >
              <td className="py-2 pr-3 font-medium text-bo-neutral-900">{row.marketLabel}</td>
              <td className="py-2 pr-3 text-bo-neutral-600">{row.country}</td>
              <td className="py-2 pr-3">
                <StateBadge state={row.state} />
              </td>
              <td className="py-2 text-right text-bo-neutral-700 tabular-nums">
                {row.compositeScore.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
