'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Brain, Loader2 } from 'lucide-react';
import { CountryToggle } from './CountryToggle';
import { PhenomenonCard } from './PhenomenonCard';
import { PhenomenonDetail } from './PhenomenonDetail';
import { SignalOfTheDayFeed } from './SignalOfTheDayFeed';
import { looksEnglishOnly } from './helpers';
import { usePhenomena } from '@/hooks/useShopperMind';
import { getMarketProfile } from '@/services/shoppermind/markets';
import type { PhenomenonStateValue } from '@stelthion/shoppermind-client-types';

interface ShopperMindDashboardProps {
  userId: string;
}

const STATES: PhenomenonStateValue[] = ['EMERGING', 'ACCELERATING', 'STABLE', 'FADING', 'DORMANT'];

export function ShopperMindDashboard({ userId }: ShopperMindDashboardProps) {
  const { t, i18n } = useTranslation('mall');
  const isFinnishLocale = i18n.language?.toLowerCase().startsWith('fi');
  const [country, setCountry] = useState('FI');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const profile = getMarketProfile(country);
  const categories = profile?.categories ?? [];

  const { data, isLoading } = usePhenomena({
    country,
    state: selectedState || undefined,
    category: selectedCategory || undefined,
  });

  const allPhenomena = data?.phenomena ?? [];
  const phenomena = isFinnishLocale
    ? allPhenomena.filter((p) => !looksEnglishOnly(p.label, p.description))
    : allPhenomena;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-bo-primary-600" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-bo-neutral-950">
              {t('shoppermind.title', 'ShopperMind')}
            </h1>
            <p className="text-sm text-bo-neutral-500">
              {t('shoppermind.tagline', 'Foresight for every mall with actionable forecasts')}
            </p>
          </div>
        </div>
        {!isFinnishLocale && <CountryToggle selected={country} onChange={setCountry} />}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bo-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('shoppermind.filters.search', 'Search phenomena')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-bo-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bo-primary-300"
          />
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="rounded-lg border border-bo-neutral-200 bg-white px-3 py-2 text-sm text-bo-neutral-700"
        >
          <option value="">{t('shoppermind.filters.allStates', 'All states')}</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {t(`shoppermind.state.${s.toLowerCase()}`, s)}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-bo-neutral-200 bg-white px-3 py-2 text-sm text-bo-neutral-700"
        >
          <option value="">{t('shoppermind.filters.category', 'Category')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>{t(`shoppermind.category.${c}`, c)}</option>
          ))}
        </select>
      </div>

      {/* Signal of the Day */}
      <SignalOfTheDayFeed country={country} />

      {/* Phenomena Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-bo-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t('shoppermind.loading', 'Analysing signals...')}
        </div>
      ) : phenomena.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-bo-neutral-400">
          <Brain className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">{t('shoppermind.empty', 'No phenomena match your filters yet.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {phenomena
            .filter((p) =>
              search.length < 2 ||
              p.label.toLowerCase().includes(search.toLowerCase()) ||
              p.description.toLowerCase().includes(search.toLowerCase()),
            )
            .map((p) => (
              <PhenomenonCard
                key={p.id}
                phenomenon={p}
                userId={userId}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
        </div>
      )}

      {data && (
        <div className="text-xs text-bo-neutral-400 text-center">
          {t('shoppermind.totalPhenomena', { count: phenomena.length })}
        </div>
      )}

      {/* Detail drawer */}
      {selectedId && (
        <PhenomenonDetail
          phenomenonId={selectedId}
          userId={userId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
