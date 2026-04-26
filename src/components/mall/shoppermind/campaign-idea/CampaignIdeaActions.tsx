'use client';

import { useTranslation } from 'react-i18next';
import { RotateCcw, MessageSquare, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  loading: boolean;
  onRegenerate: () => void;
  onRefineInChat?: () => void;
  onOpenInDetail?: () => void;
}

export function CampaignIdeaActions({
  loading,
  onRegenerate,
  onRefineInChat,
  onOpenInDetail,
}: Props) {
  const { t } = useTranslation('mall');
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <ActionButton onClick={onRegenerate} disabled={loading}>
        <RotateCcw className="w-3.5 h-3.5" />
        {t('shoppermind.campaignIdea.regenerate')}
      </ActionButton>
      {onRefineInChat && (
        <ActionButton onClick={onRefineInChat} variant="primary">
          <MessageSquare className="w-3.5 h-3.5" />
          {t('shoppermind.campaignIdea.refineInChat')}
        </ActionButton>
      )}
      {onOpenInDetail && (
        <ActionButton onClick={onOpenInDetail}>
          <ArrowUpRight className="w-3.5 h-3.5" />
          {t('shoppermind.campaignIdea.openInDetail')}
        </ActionButton>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  variant = 'ghost',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-bo-neutral-950 text-white hover:bg-bo-neutral-900'
          : 'border border-bo-neutral-200 text-bo-neutral-700 hover:bg-bo-neutral-50',
      )}
    >
      {children}
    </button>
  );
}
