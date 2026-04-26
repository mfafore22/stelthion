'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { PhenomenonSummary } from '@stelthion/shoppermind-client-types';
import { MallCard } from '@/components/mall/ui/MallCard';
import { StateBadge } from './StateBadge';
import { LifecycleContinuumCompact } from './LifecycleContinuum';
import { MiniSparkline } from './MiniSparkline';
import { PhenomenonCardFooter } from './PhenomenonCardFooter';
import { CampaignIdeaInline } from './campaign-idea';
import { localizePhenomenon } from '@/lib/shoppermind/localize';
import { useViewContext } from '@/lib/shoppermind/view-context';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';

export function PhenomenonCard({
  phenomenon,
  mallId,
}: {
  phenomenon: PhenomenonSummary;
  mallId: string | null | undefined;
}) {
  const { i18n } = useTranslation('mall');
  const router = useRouter();
  const view = useViewContext();
  const concierge = useConciergeOptional();
  const [ideaOpen, setIdeaOpen] = useState(false);

  const localized = localizePhenomenon(phenomenon, i18n.language);
  const teaser = (localized.parsed.retailerImpact ?? localized.parsed.summary).slice(0, 140);
  const velocity = phenomenon.latestVelocity ?? 0;
  const detailHref = `/mall/shoppermind/phenomenon/${encodeURIComponent(phenomenon.id)}`;

  const handleRefineInChat = () => {
    view.setValue({
      kind: 'shoppermind_trend',
      phenomenonId: phenomenon.id,
      label: localized.label,
      state: phenomenon.state,
      primaryCountry: phenomenon.culturalLocality ?? phenomenon.footTrafficLocality ?? '',
    });
    concierge?.openPanel();
  };

  return (
    <div>
      <Link href={detailHref} className="block">
        <MallCard variant="glass" padding="md" hover className="h-full">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-bo-neutral-950 leading-snug tracking-tight">
              {localized.label}
            </h3>
            <StateBadge state={phenomenon.state} />
          </div>
          <div className="mb-3">
            {phenomenon.recentScores && phenomenon.recentScores.length >= 2 ? (
              <MiniSparkline scores={phenomenon.recentScores} height={28} />
            ) : (
              <div className="h-[28px]" />
            )}
          </div>
          <LifecycleContinuumCompact state={phenomenon.state} className="mb-3" />
          {teaser && (
            <p className="text-sm text-bo-neutral-700 line-clamp-2 mb-3 leading-relaxed">
              {teaser}
            </p>
          )}
          <PhenomenonCardFooter
            phenomenon={phenomenon}
            velocity={velocity}
            ideaOpen={ideaOpen}
            onToggleIdea={() => setIdeaOpen((v) => !v)}
          />
        </MallCard>
      </Link>
      {ideaOpen && (
        <div className="mt-2 rounded-xl border border-bo-primary-200 bg-bo-primary-50/40 p-4">
          <CampaignIdeaInline
            phenomenon={phenomenon}
            mallId={mallId}
            onRefineInChat={handleRefineInChat}
            onOpenInDetail={() => router.push(detailHref)}
          />
        </div>
      )}
    </div>
  );
}
