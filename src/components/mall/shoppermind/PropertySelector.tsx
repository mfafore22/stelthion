'use client';

import { useTranslation } from 'react-i18next';

interface Option { id: string; name: string }

interface Props {
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
}

export function PropertySelector({ options, value, onChange }: Props) {
  const { t } = useTranslation('mall');
  if (!options || options.length === 0) return null;
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-bo-neutral-600 font-medium">
        {t('shoppermind.actions.selectProperty')}:
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-bo-neutral-300 bg-white px-2.5 py-1 text-sm text-bo-neutral-900 focus:outline-none focus:ring-2 focus:ring-bo-primary-500/30 focus:border-bo-primary-500"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
