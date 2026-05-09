'use client';

import type { PhenomenonStateValue } from '@stelthion/shoppermind-client-types';
import { useTranslation } from 'react-i18next';

const STYLE: Record<PhenomenonStateValue, string> = {
  EMERGING: 'bg-blue-100 text-blue-700 border-blue-200',
  ACCELERATING: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  STABLE: 'bg-gray-100 text-gray-600 border-gray-200',
  FADING: 'bg-amber-100 text-amber-700 border-amber-200',
  DORMANT: 'bg-gray-50 text-gray-400 border-gray-100',
};

export function StateBadge({ state }: { state: PhenomenonStateValue }) {
  const { t } = useTranslation('mall');
  const label = t(`shoppermind.state.${state.toLowerCase()}`, state);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STYLE[state] ?? STYLE.EMERGING}`}
    >
      {label}
    </span>
  );
}
