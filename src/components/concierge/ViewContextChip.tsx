'use client';

import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useViewContext } from '@/lib/shoppermind/view-context';

function labelFor(value: NonNullable<ReturnType<typeof useViewContext>['value']>, t: ReturnType<typeof useTranslation>['t']) {
  if (value.kind === 'shoppermind_trend') {
    return t('concierge.viewContext.shoppermindTrendChip', { label: value.label });
  }
  return value.label;
}

export function ViewContextChip() {
  const { t } = useTranslation('mall');
  const { value, clear } = useViewContext();

  if (!value) return null;

  return (
    <div className="mx-4 mt-2 mb-1 inline-flex items-center gap-2 self-start rounded-full border border-bo-primary-200 bg-bo-primary-50 px-3 py-1 text-xs text-bo-primary-900">
      <Sparkles className="w-3 h-3 text-bo-primary-700" />
      {value.returnTarget ? (
        <Link href={value.returnTarget.href} className="font-medium hover:text-bo-primary-700">
          {labelFor(value, t)}
        </Link>
      ) : (
        <span className="font-medium">{labelFor(value, t)}</span>
      )}
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
