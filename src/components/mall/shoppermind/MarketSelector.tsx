'use client';

import { useTranslation } from 'react-i18next';
import { ALL_COUNTRIES, SUPPORTED_COUNTRIES } from '@/lib/shoppermind/megaScenario';

interface Props {
  value: string;
  onChange: (country: string) => void;
}

const SUPPORTED_SET = new Set<string>(SUPPORTED_COUNTRIES);

export function MarketSelector({ value, onChange }: Props) {
  const { t } = useTranslation('mall');
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-bo-neutral-600 font-medium">{t('shoppermind.header.marketLabel')}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-bo-neutral-300 bg-white px-2.5 py-1 text-sm text-bo-neutral-900 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/30 focus:border-bo-primary-500"
      >
        {ALL_COUNTRIES.map((code) => {
          const isSupported = SUPPORTED_SET.has(code);
          const name = t(`shoppermind.markets.${code}`);
          const suffix = isSupported ? '' : ` · ${t('shoppermind.markets.comingSoon')}`;
          return (
            <option key={code} value={code}>
              {name}
              {suffix}
            </option>
          );
        })}
      </select>
    </label>
  );
}
