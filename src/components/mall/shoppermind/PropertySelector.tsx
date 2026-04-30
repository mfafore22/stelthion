'use client';

import { useTranslation } from 'react-i18next';

interface Option { id: string; name: string; operator?: string; isCompetitor?: boolean }

interface Props {
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
}

function groupOptions(options: Option[]) {
  const own = options.filter((o) => !o.isCompetitor);
  const competitors = options.filter((o) => o.isCompetitor);
  return { own, competitors };
}

export function PropertySelector({ options, value, onChange }: Props) {
  const { t } = useTranslation('mall');
  if (!options || options.length === 0) return null;
  const { own, competitors } = groupOptions(options);
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
        {own.length > 0 && (
          <optgroup label={t('shoppermind.actions.ownProperties')}>
            {own.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </optgroup>
        )}
        {competitors.length > 0 && (
          <optgroup label={t('shoppermind.actions.competitorProperties')}>
            {competitors.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.operator ?? t('shoppermind.actions.competitorTag')})
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}
