'use client';

import { useTranslation } from 'react-i18next';
import type { CampaignIdea } from '@stelthion/shoppermind-client-types';

interface Props {
  idea: CampaignIdea;
  variant?: 'compact' | 'full';
}

export function CampaignIdeaFields({ idea, variant = 'compact' }: Props) {
  const { t } = useTranslation('mall');
  const fields = t('shoppermind.campaignIdea.fields', { returnObjects: true }) as Record<
    string,
    string
  >;

  return (
    <div className="space-y-2.5 text-sm">
      <Row label={fields.hook} value={`"${idea.hook}"`} accent />
      {variant === 'full' && <Row label={fields.angle} value={idea.angle} />}
      <Row label={fields.audience} value={idea.audience} />
      <ChannelsRow label={fields.channels} channels={idea.channels} />
      {variant === 'full' && <Row label={fields.cta} value={idea.cta} />}
      <Row label={fields.successMetric} value={idea.successMetric} />
      <Row label={fields.whyNow} value={idea.whyNow} muted />
      {variant === 'full' && <Row label={fields.rationale} value={idea.rationale} muted />}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 font-semibold mb-0.5">
        {label}
      </div>
      <div
        className={
          accent
            ? 'text-bo-neutral-950 font-semibold leading-snug'
            : muted
              ? 'text-bo-neutral-600 leading-relaxed'
              : 'text-bo-neutral-800 leading-relaxed'
        }
      >
        {value}
      </div>
    </div>
  );
}

function ChannelsRow({ label, channels }: { label: string; channels: string[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-bo-neutral-400 font-semibold mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {channels.map((c) => (
          <span
            key={c}
            className="px-2 py-0.5 text-xs bg-bo-primary-50 text-bo-primary-800 rounded border border-bo-primary-200"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
