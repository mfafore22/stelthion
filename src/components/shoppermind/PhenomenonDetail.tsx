'use client';

import { X, ExternalLink, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { StateBadge } from './StateBadge';
import { TrajectorySparkline } from './TrajectorySparkline';
import { FeedbackChips } from './FeedbackChips';
import { friendlyDescription, categoryLabel } from './helpers';
import { usePhenomenonDetail } from '@/hooks/useShopperMind';
import type { PhenomenonState } from '@prisma/client';

interface PhenomenonDetailProps {
  phenomenonId: string;
  userId: string;
  onClose: () => void;
}

export function PhenomenonDetail({ phenomenonId, userId, onClose }: PhenomenonDetailProps) {
  const { t } = useTranslation('mall');
  const { data: session } = useSession();
  const { data, isLoading } = usePhenomenonDetail(phenomenonId);
  const mallName = session?.user?.customerName ?? t('shoppermind.impact.yourMall', 'your mall');

  if (isLoading || !data) {
    return (
      <div className="fixed inset-y-0 right-0 w-[480px] z-50 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-bo-neutral-200 flex items-center justify-center">
        <div className="animate-pulse text-sm text-bo-neutral-400">{t('shoppermind.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] z-50 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-bo-neutral-200 overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-bo-neutral-100 px-6 py-4 flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-3">
          <h2 className="text-lg font-bold text-bo-neutral-900 truncate">{data.label}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StateBadge state={data.state as PhenomenonState} />
            <span className="text-xs text-bo-neutral-400">{data.primaryCountry}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-bo-neutral-100 text-bo-neutral-400">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-4 space-y-6">
        <p className="text-sm text-bo-neutral-700">
          {friendlyDescription(data.description, data._count?.signals ?? 0, data.categories ?? [], t)}
        </p>

        {data.scores?.length > 2 && (
          <div>
            <h3 className="text-xs font-semibold text-bo-neutral-500 uppercase tracking-wide mb-2">
              {t('shoppermind.trajectory', '28-day trajectory')}
            </h3>
            <TrajectorySparkline
              data={data.scores.map((s: { date: string; compositeScore: number }) => ({
                date: s.date,
                compositeScore: s.compositeScore,
              }))}
              state={data.state as PhenomenonState}
              height={120}
            />
          </div>
        )}

        {data.categories?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {data.categories.map((c: string) => (
              <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-bo-neutral-100 text-bo-neutral-600">
                {categoryLabel(c, t)}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
              {t('shoppermind.impact.title', { mallName })}
            </h3>
          </div>
          <p className="text-sm text-amber-900/90 leading-relaxed">
            {t(
              `shoppermind.impact.${(data.state as string).toLowerCase()}`,
              t('shoppermind.impact.stable', 'A background force that won\'t move near-term numbers.'),
            )}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-bo-neutral-500 uppercase tracking-wide mb-2">
            {t('shoppermind.feedback.title', 'Your verdict')}
          </h3>
          <FeedbackChips phenomenonId={phenomenonId} userId={userId} />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-bo-neutral-500 uppercase tracking-wide mb-2">
            {t('shoppermind.representativeSignals', 'Representative signals')} ({data._count?.signals ?? 0})
          </h3>
          <div className="space-y-2">
            {data.signals?.slice(0, 10).map((s: { id: string; title: string; url?: string; publishedAt: string; source?: { name: string } }) => (
              <div key={s.id} className="text-sm border border-bo-neutral-100 rounded-lg p-3">
                <div className="font-medium text-bo-neutral-800 leading-snug">{s.title}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-bo-neutral-400">
                  <span>{s.source?.name}</span>
                  <span>{new Date(s.publishedAt).toLocaleDateString()}</span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-bo-primary-500 hover:underline flex items-center gap-0.5">
                      <ExternalLink className="h-3 w-3" /> link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
