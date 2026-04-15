'use client';

import { useTranslation } from 'react-i18next';
import { useSignalsOfTheDay } from '@/hooks/useShopperMind';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SignalOfTheDayFeedProps {
  country: string;
}

export function SignalOfTheDayFeed({ country }: SignalOfTheDayFeedProps) {
  const { t } = useTranslation('mall');
  const { data: entries, isLoading } = useSignalsOfTheDay(country);
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading || !entries?.length) return null;

  const latest = entries[0];

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-xl border-2 border-bo-neutral-300/60 bg-bo-glass backdrop-blur-xl shadow-bo-glass-strong overflow-hidden">
      <div className="px-5 py-3 border-b border-bo-neutral-200/50 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-bo-neutral-900">
          {t('shoppermind.signalOfDay.title', 'Signal of the Day')}
        </h3>
        <span className="text-xs text-bo-neutral-400 ml-auto">
          {new Date(latest.date).toLocaleDateString()}
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="text-sm text-bo-neutral-700 leading-relaxed whitespace-pre-line">
          {latest.narrative}
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => handleCopy(latest.id, latest.narrative)}
            className="flex items-center gap-1 text-xs text-bo-neutral-400 hover:text-bo-neutral-600 transition-colors"
          >
            {copied === latest.id ? (
              <><Check className="h-3 w-3" /> {t('shoppermind.signalOfDay.copied', 'Copied')}</>
            ) : (
              <><Copy className="h-3 w-3" /> {t('shoppermind.signalOfDay.copyLink', 'Copy')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
