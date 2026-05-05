'use client';

import { DatabaseZap, MessageSquareText, ShieldCheck, Tags } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TrustStats {
  sourceCount: number;
  trendCount: number;
  categoryCount: number;
  customerName?: string | null;
}

const items = [
  { key: 'sources', icon: DatabaseZap, tone: 'from-bo-primary-600 via-bo-accent-500 to-bo-success' },
  { key: 'scope', icon: ShieldCheck, tone: 'from-bo-success via-bo-primary-500 to-bo-primary-800' },
  { key: 'feedback', icon: MessageSquareText, tone: 'from-bo-accent-500 via-bo-primary-500 to-bo-primary-800' },
  { key: 'categories', icon: Tags, tone: 'from-bo-primary-700 via-bo-success to-bo-accent-500' },
] as const;

export function ShopperMindTrustStrip({
  sourceCount,
  trendCount,
  categoryCount,
  customerName,
}: TrustStats) {
  const { t } = useTranslation('mall');
  const values = {
    sources: t('shoppermind.trust.sources.value', { count: sourceCount }),
    scope: customerName || t('shoppermind.trust.scope.fallback'),
    feedback: t('shoppermind.trust.feedback.value'),
    categories: t('shoppermind.trust.categories.value', { count: categoryCount || trendCount }),
  };
  return (
    <section aria-label={t('shoppermind.trust.title')} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(({ key, icon: Icon, tone }) => (
        <div key={key} className="bo-surface-hover relative overflow-hidden rounded-xl border-2 border-bo-neutral-300/60 bg-bo-glass p-4 shadow-bo-glass-strong backdrop-blur-xl">
          <div className={cn('absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r', tone)} />
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bo-neutral-500">
              {t(`shoppermind.trust.${key}.label`)}
            </span>
            <span className="rounded-full border border-bo-neutral-200 bg-white/70 p-1.5 text-bo-neutral-700">
              <Icon size={15} strokeWidth={1.9} />
            </span>
          </div>
          <div className="text-sm font-semibold leading-snug text-bo-neutral-950">
            {values[key]}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-bo-neutral-600">
            {t(`shoppermind.trust.${key}.body`)}
          </p>
        </div>
      ))}
    </section>
  );
}
