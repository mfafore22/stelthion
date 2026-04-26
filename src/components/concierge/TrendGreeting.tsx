'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useViewContext } from '@/lib/shoppermind/view-context';

export function TrendGreeting() {
  const { t } = useTranslation('mall');
  const { value } = useViewContext();

  if (!value || value.kind !== 'shoppermind_trend') return null;

  const message = t('concierge.greetings.shoppermindTrend', {
    label: value.label,
    state: value.state,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mx-4 mt-4 mb-2 flex items-start gap-3 rounded-xl border border-bo-primary-200/60 bg-bo-primary-50/60 p-4 backdrop-blur-sm"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bo-primary-100 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-bo-primary-700" />
      </div>
      <p className="text-sm text-bo-neutral-900 leading-relaxed whitespace-pre-wrap">
        {message}
      </p>
    </motion.div>
  );
}
