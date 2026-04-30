'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { MarketSelector } from './MarketSelector';

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
    <header className="sticky top-[80px] z-10 -mx-8 px-8 py-3 bg-bo-neutral-50/85 backdrop-blur-md border-b border-bo-neutral-200/60">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-bo-primary-100 flex items-center justify-center shrink-0">
            <Image
              src="/shoppermind-icon.png"
              alt=""
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-bo-neutral-950 tracking-tight leading-tight">
              {t('shoppermind.header.title')}
            </h1>
            {monthLabel && (
              <p className="text-xs text-bo-neutral-600 mt-0.5">{monthLabel}</p>
            )}
          </div>
        </div>
        <MarketSelector value={country} onChange={onCountryChange} />
      </div>
    </header>
  );
}
