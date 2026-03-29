/**
 * ZoneStorePicker — Searchable dropdown for selecting zones (with stores nested),
 * grouped by floor. Selecting a store resolves to its parent zone.
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { IDEAPARK_ZONES, IDEAPARK_UPPER_ZONES, type IdeaparkZone } from '@/lib/data/ideaparkZones';
import type { IdeaparkStore } from '@/lib/data/ideaparkStores';
import { useTranslation } from 'react-i18next';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Minimal zone shape accepted from external sources (e.g. SWR Zone type) */
interface ZoneLike {
  id: string;
  name: string;
  nameFi: string;
  category: string;
}

interface ZoneStorePickerProps {
  value: string | null;
  onChange: (zoneId: string | null) => void;
  /** Zones to exclude from the list (e.g. already selected origin) */
  exclude?: string[];
  placeholder?: string;
  label?: string;
  /** Optional external zone list — keeps IDs in sync with floorplan */
  zones?: ZoneLike[];
}

const STATIC_ZONES: IdeaparkZone[] = [...IDEAPARK_ZONES, ...IDEAPARK_UPPER_ZONES];

export function ZoneStorePicker({ value, onChange, exclude = [], placeholder, label, zones }: ZoneStorePickerProps) {
  const { t } = useTranslation('mall');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Use provided zones or fall back to static data
  const allZones: ZoneLike[] = zones ?? STATIC_ZONES;
  const groundZoneIds = new Set(IDEAPARK_ZONES.map((z) => z.id));

  // Fetch stores
  const { data: stores = [] } = useSWR<IdeaparkStore[]>('/api/ideapark/stores', fetcher);

  // Group stores by zoneId
  const storesByZone = useMemo(() => {
    const map = new Map<string, IdeaparkStore[]>();
    for (const s of stores) {
      if (s.zoneId) {
        const list = map.get(s.zoneId) ?? [];
        list.push(s);
        map.set(s.zoneId, list);
      }
    }
    return map;
  }, [stores]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedZone = allZones.find((z) => z.id === value);
  const query = search.toLowerCase();

  // Filter zones + check if any nested store matches
  const filterZone = (z: ZoneLike) => {
    if (exclude.includes(z.id)) return false;
    if (!query) return true;
    if (z.nameFi.toLowerCase().includes(query) || z.name.toLowerCase().includes(query)) return true;
    // Check if any store in this zone matches
    const zoneStores = storesByZone.get(z.id) ?? [];
    return zoneStores.some((s) => s.name.toLowerCase().includes(query));
  };

  const groundZones = allZones.filter((z) => groundZoneIds.has(z.id) && filterZone(z));
  const upperZones = allZones.filter((z) => !groundZoneIds.has(z.id) && filterZone(z));

  const handleSelect = (zoneId: string) => {
    onChange(zoneId);
    setOpen(false);
    setSearch('');
  };

  const renderZoneWithStores = (zone: ZoneLike) => {
    const zoneStores = (storesByZone.get(zone.id) ?? []).filter(
      (s) => !query || s.name.toLowerCase().includes(query) || zone.nameFi.toLowerCase().includes(query) || zone.name.toLowerCase().includes(query)
    );

    return (
      <div key={zone.id}>
        {/* Zone header (clickable) */}
        <button
          type="button"
          onClick={() => handleSelect(zone.id)}
          className={cn(
            'w-full text-left px-3 py-2 text-xs hover:bg-bo-neutral-50 transition-colors flex items-center justify-between',
            value === zone.id && 'bg-bo-neutral-100 font-semibold'
          )}
        >
          <span>{zone.nameFi}</span>
          <span className="text-bo-neutral-300 text-[10px]">{zone.category}</span>
        </button>
        {/* Nested stores */}
        {zoneStores.map((store) => (
          <button
            key={store.id}
            type="button"
            onClick={() => handleSelect(zone.id)}
            className={cn(
              'w-full text-left pl-6 pr-3 py-1.5 text-[11px] hover:bg-bo-neutral-50 transition-colors flex items-center justify-between',
              value === zone.id && 'bg-bo-neutral-50'
            )}
          >
            <span className="text-bo-neutral-600">{store.name}</span>
            <span className="text-bo-neutral-300 text-[9px] truncate max-w-[80px]">{store.category}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-bo-neutral-500 mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
          'bg-white border-bo-neutral-200 hover:border-bo-neutral-400',
          open && 'border-bo-neutral-500 ring-1 ring-bo-neutral-200',
          !value && 'text-bo-neutral-400'
        )}
      >
        <span className="truncate">
          {selectedZone ? selectedZone.nameFi : (placeholder || t('flowQuery.selectZone', 'Valitse alue'))}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 ml-2 text-bo-neutral-400">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-bo-neutral-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-bo-neutral-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('flowQuery.searchZone', 'Hae aluetta tai liikettä...')}
              className="w-full px-2 py-1.5 text-xs rounded border border-bo-neutral-200 focus:outline-none focus:border-bo-neutral-400"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-56">
            {/* Ground floor */}
            {groundZones.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-bo-neutral-400 uppercase tracking-wider bg-bo-neutral-50">
                  Pohjakerros
                </div>
                {groundZones.map(renderZoneWithStores)}
              </>
            )}

            {/* Upper floor */}
            {upperZones.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-bo-neutral-400 uppercase tracking-wider bg-bo-neutral-50">
                  Yläkerta
                </div>
                {upperZones.map(renderZoneWithStores)}
              </>
            )}

            {groundZones.length === 0 && upperZones.length === 0 && (
              <div className="px-3 py-4 text-xs text-bo-neutral-400 text-center">
                {t('flowQuery.noResults', 'Ei tuloksia')}
              </div>
            )}
          </div>

          {/* Clear selection */}
          {value && (
            <div className="border-t border-bo-neutral-100 p-2">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
                className="w-full text-center text-xs text-bo-neutral-400 hover:text-bo-neutral-600 py-1"
              >
                {t('flowQuery.clearSelection', 'Tyhjennä valinta')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
