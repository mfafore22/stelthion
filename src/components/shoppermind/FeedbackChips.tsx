'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeedbackChipsProps {
  phenomenonId: string;
  userId: string;
  onSubmit?: (verdict: string) => void;
}

const VERDICTS = [
  { key: 'star', Icon: Star, className: 'hover:bg-yellow-50 hover:text-yellow-600' },
  { key: 'relevant', Icon: ThumbsUp, className: 'hover:bg-emerald-50 hover:text-emerald-600' },
  { key: 'not_relevant', Icon: ThumbsDown, className: 'hover:bg-red-50 hover:text-red-600' },
  { key: 'noise', Icon: Volume2, className: 'hover:bg-gray-100 hover:text-gray-600' },
] as const;

export function FeedbackChips({ phenomenonId, userId, onSubmit }: FeedbackChipsProps) {
  const { t } = useTranslation('mall');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (verdict: string) => {
    if (loading || submitted) return;
    setLoading(true);
    try {
      await fetch(`/api/shoppermind/phenomena/${phenomenonId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict, userId }),
      });
      setSubmitted(verdict);
      onSubmit?.(verdict);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      {VERDICTS.map(({ key, Icon, className }) => (
        <button
          key={key}
          onClick={() => submit(key)}
          disabled={!!submitted || loading}
          title={t(`shoppermind.feedback.${key === 'not_relevant' ? 'notRelevant' : key}`, key)}
          className={`p-1.5 rounded-md text-bo-neutral-400 transition-colors ${
            submitted === key ? 'bg-bo-primary-50 text-bo-primary-600' : submitted ? 'opacity-30' : className
          } disabled:cursor-not-allowed`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
