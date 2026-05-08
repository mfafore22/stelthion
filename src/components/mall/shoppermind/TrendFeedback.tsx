'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrendFeedback, type FeedbackEntityType } from './useTrendFeedback';

const REASONS = ['notPropertyRelevant', 'wrongCategory', 'outdated', 'notPractical', 'missingEvidence', 'alreadyHandled'];

export function TrendFeedback({
  phenomenonId,
  mallId,
  entityType = 'trend',
  entityLabel,
  categoryIds = [],
  promptContext,
  generatedAnswer,
}: {
  phenomenonId: string;
  mallId: string | null;
  entityType?: FeedbackEntityType;
  entityLabel?: string;
  categoryIds?: string[];
  promptContext?: string;
  generatedAnswer?: string;
}) {
  const { t, i18n } = useTranslation('mall');
  const [reasonCodes, setReasonCodes] = useState<string[]>([]);
  const feedback = useTrendFeedback(phenomenonId, mallId, {
    entityType, entityLabel, categoryIds, reasonCodes, promptContext, generatedAnswer, language: i18n.language,
  });
  const { verdict, setVerdict, note, setNote, status, editing, setEditing, error, submit } = feedback;

  if (!editing && status === 'submitted' && verdict) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-bo-neutral-700">
          <Check className="w-4 h-4 text-bo-success" />
          <span>{t('shoppermind.feedback.submitted')}</span>
          <span className="text-bo-neutral-400">·</span>
          <span className="font-medium">
            {verdict === 'relevant'
              ? t('shoppermind.feedback.relevant')
              : t('shoppermind.feedback.notRelevant')}
          </span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-bo-primary hover:underline font-medium"
        >
          {t('shoppermind.feedback.edit')}
        </button>
      </div>
    );
  }

  const busy = status === 'submitting';
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ThumbButton active={verdict === 'relevant'} onClick={() => submit('relevant')} disabled={busy}>
          <ThumbsUp className="w-4 h-4" />
          {t('shoppermind.feedback.relevant')}
        </ThumbButton>
        <ThumbButton active={verdict === 'not_relevant'} onClick={() => setVerdict('not_relevant')} disabled={busy}>
          <ThumbsDown className="w-4 h-4" />
          {t('shoppermind.feedback.notRelevant')}
        </ThumbButton>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('shoppermind.feedback.commentPlaceholder')}
        rows={2}
        className="bo-surface-subtle w-full rounded-lg border border-bo-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-bo-primary-600"
      />
      {verdict === 'not_relevant' && (
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setReasonCodes((prev) => (
                prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
              ))}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                reasonCodes.includes(reason)
                  ? 'border-bo-primary-300 bg-bo-primary-100 text-bo-primary-800'
                  : 'border-bo-neutral-200 bg-white/70 text-bo-neutral-600 hover:border-bo-primary-200',
              )}
            >
              {t(`shoppermind.feedback.reasons.${reason}`)}
            </button>
          ))}
        </div>
      )}
      {verdict === 'not_relevant' && (
        <button
          type="button"
          onClick={() => submit('not_relevant')}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg bg-bo-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-bo-primary-800 disabled:opacity-50"
        >
          {t('shoppermind.feedback.submit')}
        </button>
      )}
      {busy && <div className="text-xs text-bo-neutral-400">{t('shoppermind.feedback.submitting')}</div>}
      {status === 'error' && (
        <div className="text-xs text-bo-error">
          {t('shoppermind.feedback.error')}{error ? ` (${error})` : ''}
        </div>
      )}
    </div>
  );
}

function ThumbButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-50',
        active
          ? 'bg-bo-primary-100 border-bo-primary-300 text-bo-primary-800'
          : 'bo-interactive-box text-bo-neutral-700',
      )}
    >
      {children}
    </button>
  );
}
