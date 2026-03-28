/**
 * FlowQueryResults — Narrative panel + horizontal bar breakdown.
 * Supports EN/FI based on current i18n language.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { FlowQueryResponse } from '@/lib/types/flowQuery';
import { useTranslation } from 'react-i18next';

interface FlowQueryResultsProps {
  data: FlowQueryResponse;
  onReset: () => void;
}

const BAR_COLORS = [
  '#1e293b', '#475569', '#64748b', '#94a3b8', '#cbd5e1',
  '#166534', '#15803d', '#22c55e', '#86efac',
];

export function FlowQueryResults({ data, onReset }: FlowQueryResultsProps) {
  const { i18n, t } = useTranslation('mall');
  const isFi = i18n.language === 'fi';
  const narrative = isFi ? data.narrativeFi : data.narrativeEn;

  const maxVisitors = data.edges.length > 0 ? data.edges[0].visitors : 1;

  const directionLabel = data.direction === 'outbound'
    ? t('flowQuery.outbound', 'Lähtevä')
    : data.direction === 'inbound'
      ? t('flowQuery.inbound', 'Saapuva')
      : t('flowQuery.between', 'Välillä');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-bo-neutral-800">
            {data.originName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bo-neutral-100 text-bo-neutral-500 font-medium">
            {directionLabel}
          </span>
          {data.destinationName && (
            <>
              <span className="text-bo-neutral-300">→</span>
              <span className="text-xs font-semibold text-bo-neutral-800">
                {data.destinationName}
              </span>
            </>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-bo-neutral-400 hover:text-bo-neutral-600 transition-colors"
        >
          {t('flowQuery.newQuery', 'Uusi kysely')}
        </button>
      </div>

      {/* Narrative */}
      <div className="bg-bo-neutral-50 rounded-lg px-3 py-2.5 text-xs text-bo-neutral-700 leading-relaxed border border-bo-neutral-100">
        {narrative}
      </div>

      {/* Total */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-bo-neutral-900 tabular-nums">
          {data.totalVisitors.toLocaleString(isFi ? 'fi-FI' : 'en-US')}
        </span>
        <span className="text-xs text-bo-neutral-500">
          {t('flowQuery.visitorsTotal', 'kävijää yhteensä')}
        </span>
      </div>

      {/* Bar breakdown */}
      {data.edges.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-bo-neutral-400 uppercase tracking-wider mb-2">
            {data.direction === 'inbound'
              ? t('flowQuery.sourceBreakdown', 'Lähteet')
              : t('flowQuery.destinationBreakdown', 'Kohteet')}
          </div>
          {data.edges.map((edge, i) => {
            const barWidth = maxVisitors > 0 ? (edge.visitors / maxVisitors) * 100 : 0;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            const zoneName = data.direction === 'inbound' ? edge.fromName : edge.toName;

            return (
              <div key={`${edge.from}-${edge.to}`} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-bo-neutral-700 font-medium truncate">{zoneName}</span>
                  <span className="text-bo-neutral-500 tabular-nums ml-2 shrink-0">
                    {edge.visitors.toLocaleString(isFi ? 'fi-FI' : 'en-US')}
                    <span className="text-bo-neutral-300 ml-1">({Math.round(edge.share * 100)}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-bo-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
