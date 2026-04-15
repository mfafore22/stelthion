'use client';

import { useTranslation } from 'react-i18next';

const COUNTRIES = [
  { code: 'FI', labelKey: 'shoppermind.country.fi' },
  { code: 'AE', labelKey: 'shoppermind.country.ae' },
] as const;

interface CountryToggleProps {
  selected: string;
  onChange: (country: string) => void;
}

export function CountryToggle({ selected, onChange }: CountryToggleProps) {
  const { t } = useTranslation('mall');

  return (
    <div className="inline-flex rounded-lg border border-bo-neutral-200 bg-bo-neutral-50 p-0.5">
      {COUNTRIES.map((c) => (
        <button
          key={c.code}
          onClick={() => onChange(c.code)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-bo-out-expo ${
            selected === c.code
              ? 'bg-white text-bo-neutral-900 shadow-sm'
              : 'text-bo-neutral-500 hover:text-bo-neutral-700'
          }`}
        >
          {t(c.labelKey, c.code)}
        </button>
      ))}
    </div>
  );
}
