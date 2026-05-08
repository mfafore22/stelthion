'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ExternalLink } from 'lucide-react';
import type { PhenomenonSummary } from '@stelthion/shoppermind-client-types';
import { MallCard } from '@/components/mall/ui/MallCard';
import { StateBadge } from './StateBadge';
import { LifecycleContinuumCompact } from './LifecycleContinuum';
import { MiniSparkline } from './MiniSparkline';
import { PhenomenonCardFooter } from './PhenomenonCardFooter';
import { PhenomenonSourceStrip } from './PhenomenonSourceStrip';
import { CampaignIdeaInline } from './campaign-idea';
import { VisualBanner } from '@/components/mall/visuals/VisualBanner';
import { localizePhenomenon } from '@/lib/shoppermind/localize';
import { trendBannerSrc } from '@/lib/shoppermind/visualTheme';
import { useViewContext } from '@/lib/shoppermind/view-context';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';
import { inferRetailCategoryImpacts } from '@/lib/shoppermind/retailCategories';
import { sentencePreview } from '@/lib/text/sentencePreview';
import { CategoryImpactChips } from './CategoryImpactChips';
import { useShopperMindActivity } from './useShopperMindActivity';

export function PhenomenonCard({
  phenomenon,
  mallId,
}: {
  phenomenon: PhenomenonSummary;
  mallId: string | null | undefined;
}) {
  const { t, i18n } = useTranslation('mall');
  const router = useRouter();
  const view = useViewContext();
  const concierge = useConciergeOptional();
  const track = useShopperMindActivity({ mallId });
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const localized = localizePhenomenon(phenomenon, i18n.language);
  const teaser = sentencePreview(localized.parsed.retailerImpact ?? localized.parsed.summary, 180);
  const categoryImpacts = inferRetailCategoryImpacts([
    phenomenon.id,
    localized.label,
    localized.description,
    localized.parsed.summary,
    localized.parsed.retailerImpact,
    localized.parsed.opportunity,
  ].filter(Boolean).join(' | '));
  const velocity = phenomenon.latestVelocity ?? 0;
  const detailHref = `/mall/shoppermind/phenomenon/${encodeURIComponent(phenomenon.id)}`;

  const handleRefineInChat = () => {
    view.setValue({
      kind: 'shoppermind_trend',
      phenomenonId: phenomenon.id,
      label: localized.label,
      state: phenomenon.state,
      primaryCountry: phenomenon.culturalLocality ?? phenomenon.footTrafficLocality ?? '',
      returnTarget: { label: localized.label, href: detailHref },
    });
    concierge?.openPanel();
  };

  return (
    <div>
      <MallCard variant="glass" padding="md" hover className="h-full">
        <VisualBanner
          src={trendBannerSrc(phenomenon.id, localized.label, localized.parsed.summary, localized.parsed.retailerImpact)}
          alt={localized.label}
          className="mb-3"
        />
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
          <p className="text-sm text-bo-neutral-700 mb-3 leading-relaxed">
            {teaser}
          </p>
        )}
        <div className="mb-3">
          <CategoryImpactChips impacts={categoryImpacts} compact />
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              track({
                eventName: 'trend_expand',
                tab: 'trends',
                entityType: 'trend',
                entityId: phenomenon.id,
                entityLabel: localized.label,
                categoryIds: categoryImpacts.map((i) => i.id),
              });
            }
          }}
          aria-expanded={open}
          className="text-[11px] text-bo-primary-700 hover:text-bo-primary-900 inline-flex items-center gap-1"
        >
          {open ? t('shoppermind.section.collapse') : t('shoppermind.section.expand')}
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="mt-3 space-y-3 border-t border-bo-neutral-200/60 pt-3">
            <TrendText label={t('shoppermind.sections.summary')} value={localized.parsed.summary} />
            <TrendText label={t('shoppermind.sections.impact')} value={localized.parsed.retailerImpact} />
            <TrendText label={t('shoppermind.sections.opportunity')} value={localized.parsed.opportunity} />
            <CategoryImpactChips impacts={categoryImpacts} />
            <Link
              href={detailHref}
              onClick={() => track({
                eventName: 'detail_open',
                tab: 'trends',
                entityType: 'trend',
                entityId: phenomenon.id,
                entityLabel: localized.label,
                categoryIds: categoryImpacts.map((i) => i.id),
              })}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-bo-primary-700 hover:text-bo-primary-900"
            >
              {t('shoppermind.campaignIdea.openInDetail')}
              <ExternalLink size={10} />
            </Link>
            <PhenomenonSourceStrip phenomenonId={phenomenon.id} mallId={mallId} />
          </div>
        )}
        <PhenomenonCardFooter
          phenomenon={phenomenon}
          velocity={velocity}
          ideaOpen={ideaOpen}
          onToggleIdea={() => setIdeaOpen((v) => !v)}
        />
      </MallCard>
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

function TrendText({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <section>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-bo-neutral-500">{label}</div>
      <p className="text-sm leading-relaxed text-bo-neutral-800">{value}</p>
    </section>
  );
}
