'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GdprDisclaimer() {
  const { t } = useTranslation('mall');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-bo-primary-200/50 bg-bo-primary-50/40 px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <ShieldCheck className="w-4 h-4 text-bo-primary-500 shrink-0" />
        <span className="text-xs font-medium text-bo-primary-700 flex-1">
          {t('videoAnalysis.gdpr.title')}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-bo-primary-400 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded && (
        <p className="mt-2 text-[11px] leading-relaxed text-bo-primary-600/80 pl-6">
          {t('videoAnalysis.gdpr.description')}
        </p>
      )}
    </div>
  );
}
