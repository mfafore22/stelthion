/**
 * ZoneStoreList
 *
 * Renders the list of shops in a selected floor-plan zone,
 * fetched live from /api/ideapark/stores?zone={zoneId}.
 * All UI text is in Finnish.
 */

'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import type { IdeaparkStore } from '@/lib/data/ideaparkStores';

// ─── Category colour pills ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Aikuisten muoti':              { bg: '#fdf2f8', text: '#9d174d' },
  'Kahvilat & ravintolat':        { bg: '#fff7ed', text: '#c2410c' },
  'Kauneus & terveys':            { bg: '#f0fdfa', text: '#0f766e' },
  'Autoilu':                      { bg: '#eff6ff', text: '#1d4ed8' },
  'Palvelut':                     { bg: '#f8fafc', text: '#475569' },
  'Lapsille':                     { bg: '#fefce8', text: '#a16207' },
  'Koti & sisustus':              { bg: '#fdf4ff', text: '#7e22ce' },
  'Korut, asusteet & laukut':     { bg: '#fff1f2', text: '#be123c' },
  'Päivittäistavarat & tekniikka':{ bg: '#f0f9ff', text: '#0369a1' },
  'Aikuisten jalkineet':          { bg: '#fff7ed', text: '#9a3412' },
  'Urheilu & harrastukset':       { bg: '#f0fdf4', text: '#15803d' },
};

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: '#f1f5f9', text: '#334155' };
}

// ─── SWR fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Sub-components ───────────────────────────────────────────────────────────

function StoreSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-36 rounded bg-slate-200" />
        <div className="h-2.5 w-24 rounded bg-slate-100" />
      </div>
      <div className="h-4 w-16 rounded-full bg-slate-100" />
    </div>
  );
}

function StoreRow({ store }: { store: IdeaparkStore }) {
  const style = categoryStyle(store.category);
  return (
    <a
      href={store.url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 group',
        store.url ? 'cursor-pointer hover:bg-slate-50 -mx-4 px-4 transition-colors' : 'cursor-default'
      )}
    >
      {/* Location code badge */}
      <span className="shrink-0 text-[9px] font-mono text-slate-400 w-9 text-right tabular-nums">
        {store.locationCode}
      </span>

      {/* Name + phone */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-xs font-semibold text-slate-800 truncate leading-tight',
          store.url && 'group-hover:text-slate-900'
        )}>
          {store.name}
        </div>
        {store.phone && (
          <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
            {store.phone}
          </div>
        )}
      </div>

      {/* Category pill */}
      <span
        className="shrink-0 text-[9px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {store.category}
      </span>

      {/* External link arrow */}
      {store.url && (
        <svg
          className="shrink-0 w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors"
          fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.5}
        >
          <path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ZoneStoreListProps {
  zoneId: string;
  zoneName: string;
  storeCount?: number;
  onClose: () => void;
}

export function ZoneStoreList({ zoneId, zoneName, onClose }: ZoneStoreListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('Kaikki');

  const { data: stores, isLoading, error } = useSWR<IdeaparkStore[]>(
    `/api/ideapark/stores?zone=${zoneId}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );

  // Derive unique categories from fetched stores
  const categories = stores
    ? ['Kaikki', ...Array.from(new Set(stores.map((s) => s.category))).sort()]
    : ['Kaikki'];

  const visible = stores
    ? categoryFilter === 'Kaikki'
      ? stores
      : stores.filter((s) => s.category === categoryFilter)
    : [];

  // Sort: by location code numerically
  const sorted = [...visible].sort((a, b) => {
    const n = (code: string) => parseFloat(code.replace(/[^\d.]/g, '')) || 999;
    return n(a.locationCode) - n(b.locationCode);
  });

  return (
    <div className="border-t border-slate-100 bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">{zoneName}</span>
          {stores && (
            <span className="text-[10px] text-slate-400 font-medium">
              · {stores.length} liikettä
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
          aria-label="Sulje liikepaneeli"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>

      {/* Category filter pills */}
      {!isLoading && !error && categories.length > 2 && (
        <div className="flex gap-1.5 flex-wrap px-4 py-2.5 border-b border-slate-100 bg-slate-50/30">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'text-[10px] font-medium px-2.5 py-1 rounded-full transition-all',
                categoryFilter === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {cat}
              {cat !== 'Kaikki' && stores && (
                <span className="ml-1 opacity-60">
                  {stores.filter((s) => s.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Store rows */}
      <div className="px-4 max-h-60 overflow-y-auto">
        {isLoading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => <StoreSkeleton key={i} />)}
          </>
        )}

        {error && (
          <div className="py-6 text-center text-xs text-slate-400">
            Liikkeiden lataaminen epäonnistui. Yritä uudelleen.
          </div>
        )}

        {!isLoading && !error && sorted.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            Ei liikkeitä tässä kategoriassa.
          </div>
        )}

        {!isLoading && !error && sorted.map((store) => (
          <StoreRow key={store.id} store={store} />
        ))}
      </div>
    </div>
  );
}
