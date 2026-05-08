'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Wand2 } from 'lucide-react';
import type { PhenomenonSummary } from '@stelthion/shoppermind-client-types';
import { useCampaignIdea } from './useCampaignIdea';
import { CampaignIdeaFields } from './CampaignIdeaFields';
import { CampaignIdeaActions } from './CampaignIdeaActions';

interface Props {
  phenomenon: Pick<PhenomenonSummary, 'id' | 'label' | 'state'> & { primaryCountry?: string };
  mallId: string | null | undefined;
  variant?: 'compact' | 'full';
  autoGenerate?: boolean;
  onRefineInChat?: () => void;
  onOpenInDetail?: () => void;
}

export function CampaignIdeaInline({
  phenomenon,
  mallId,
  variant = 'compact',
  autoGenerate = true,
  onRefineInChat,
  onOpenInDetail,
}: Props) {
  const { t } = useTranslation('mall');
  const { idea, loading, error, generate } = useCampaignIdea({
    phenomenonId: phenomenon.id,
    mallId,
  });

  useEffect(() => {
    if (autoGenerate && !idea && !loading && !error) generate();
  }, [autoGenerate, idea, loading, error, generate]);

  if (loading && !idea) {
    return (
      <div className="flex items-center gap-2 text-sm text-bo-neutral-500 py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('shoppermind.campaignIdea.generating')}
      </div>
    );
  }

  if (error && !idea) {
    return (
      <div className="rounded-lg border border-bo-warning/40 bg-bo-warning-light/30 p-3 text-sm">
        <div className="font-medium text-bo-warning-dark mb-1">
          {t('shoppermind.campaignIdea.errorTitle')}
        </div>
        <div className="text-bo-warning-dark/80 mb-2">
          {t('shoppermind.campaignIdea.errorBody')}
        </div>
        <CampaignIdeaActions loading={loading} onRegenerate={() => generate()} />
      </div>
    );
  }

  if (!idea) {
    return (
      <button
        type="button"
        onClick={() => generate()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-bo-neutral-950 text-white hover:bg-bo-neutral-900 transition-colors"
      >
        <Wand2 className="w-4 h-4" />
        {t('shoppermind.campaignIdea.generate')}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <CampaignIdeaFields idea={idea} variant={variant} />
      <CampaignIdeaActions
        loading={loading}
        onRegenerate={() => generate()}
        onRefineInChat={onRefineInChat}
        onOpenInDetail={onOpenInDetail}
      />
    </div>
  );
}
