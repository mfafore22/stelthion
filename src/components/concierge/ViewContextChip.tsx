'use client';

import { Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useViewContext } from '@/lib/shoppermind/view-context';

export function ViewContextChip() {
  const { t } = useTranslation('mall');
  const { value, clear } = useViewContext();

  if (!value || value.kind !== 'shoppermind_trend') return null;

  return (
    <div className="mx-4 mt-2 mb-1 inline-flex items-center gap-2 self-start rounded-full border border-bo-primary-200 bg-bo-primary-50 px-3 py-1 text-xs text-bo-primary-900">
      <Sparkles className="w-3 h-3 text-bo-primary-700" />
      <span className="font-medium">
        {t('concierge.viewContext.shoppermindTrendChip', { label: value.label })}
      </span>
      <button
        type="button"
        onClick={clear}
        className="ml-1 p-0.5 rounded-full hover:bg-bo-primary-100 transition-colors"
        title={t('concierge.viewContext.clear')}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
