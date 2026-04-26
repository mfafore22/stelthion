'use client';

import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

export function AssistantsView() {
  const { t } = useTranslation('mall');

  return (
    <div className="rounded-2xl border-2 border-bo-primary-200/60 bg-bo-glass shadow-bo-glass-strong backdrop-blur-xl p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-bo-primary-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-bo-primary-700" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
              {t('assistants.comingSoon')}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-bo-primary-100 text-bo-primary-800 uppercase">
              {t('navigation.comingSoon')}
            </span>
          </div>
          <p className="text-sm text-bo-neutral-700 leading-relaxed max-w-3xl">
            {t('assistants.integrationDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
