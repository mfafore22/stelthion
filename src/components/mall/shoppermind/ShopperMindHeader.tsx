'use client';

import { useTranslation } from 'react-i18next';
import { MarketSelector } from './MarketSelector';
import { ShopperMindIcon } from './ShopperMindIcon';

interface Props {
  country: string;
  onCountryChange: (country: string) => void;
}

export function ShopperMindHeader({ country, onCountryChange }: Props) {
  const { t, i18n } = useTranslation('mall');
  const monthLabel = (() => {
    try {
      const formatted = new Intl.DateTimeFormat(i18n.language, {
        month: 'long',
        year: 'numeric',
      }).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return null;
    }
  })();

  return (
    <header className="sticky top-0 z-20 border-b border-bo-neutral-200/60 bg-white/55 shadow-[0_4px_24px_rgba(17,24,39,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl saturate-150">
      <div className="px-8 max-w-[1600px] mx-auto py-3 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-bo-primary-100 flex items-center justify-center shrink-0">
            <ShopperMindIcon className="h-7 w-7 text-bo-primary-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl tracking-tight leading-tight">
              <span className="font-semibold text-bo-neutral-950">{t('shoppermind.header.titleBrand')}</span>
              <span className="font-normal text-bo-neutral-700"> {t('shoppermind.header.titleSuffix')}</span>
            </h1>
            {monthLabel && <p className="text-xs text-bo-neutral-600 mt-0.5">{monthLabel}</p>}
          </div>
        </div>
        <MarketSelector value={country} onChange={onCountryChange} />
      </div>
    </header>
  );
}
