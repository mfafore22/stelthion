'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowUpRight, Boxes, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { categoryLabel, type RetailCategoryId } from '@/lib/shoppermind/retailCategories';
import { cn } from '@/lib/utils';
import { useShopperMindActivity } from './useShopperMindActivity';

interface StoreRef { name: string; category: string; floor: string; location: string }
interface TenantInsight {
  id: string;
  title: string;
  need: string;
  recommendation: string;
  focus: string;
  reduce: string;
  campaignAngle: string;
  horizon: 'short' | 'medium' | 'long';
  move: 'increase' | 'reposition' | 'reduce' | 'test' | 'recruit';
  categoryIds: string[];
  stores: StoreRef[];
}
interface TenantImpactResponse {
  sourceMode: string;
  insights: TenantInsight[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const moveTone: Record<TenantInsight['move'], string> = {
  increase: 'border-bo-success/30 bg-bo-success-light/50 text-bo-success-dark',
  reposition: 'border-bo-primary-200 bg-bo-primary-50 text-bo-primary-800',
  reduce: 'border-bo-error/30 bg-bo-error-light/50 text-bo-error-dark',
  test: 'border-bo-warning/30 bg-bo-warning-light/50 text-bo-warning-dark',
  recruit: 'border-bo-neutral-300 bg-bo-neutral-100 text-bo-neutral-800',
};

export function TenantImpactPanel({
  mallId,
  marketId,
}: {
  mallId: string | null;
  marketId?: string | null;
}) {
  const { t, i18n } = useTranslation('mall');
  const track = useShopperMindActivity({ mallId, marketId });
  const key = mallId
    ? `/api/shoppermind/tenant-impact?mallId=${encodeURIComponent(mallId)}&lang=${encodeURIComponent(i18n.language)}`
    : null;
  const { data } = useSWR<TenantImpactResponse>(key, fetcher);
  const insights = data?.insights ?? [];
  if (!mallId || insights.length === 0) return null;

  return (
    <section className="bo-surface bo-surface-hover rounded-2xl border-2 border-bo-primary-200/60 p-5 shadow-bo-glass">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
            <Boxes size={15} />
            {t('shoppermind.tenantImpact.eyebrow')}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-bo-neutral-950">
            {t('shoppermind.tenantImpact.title')}
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-bo-neutral-600">
            {t('shoppermind.tenantImpact.body')}
          </p>
        </div>
        <span className="rounded-full border border-bo-neutral-200 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">
          {t('shoppermind.tenantImpact.liveReady')}
        </span>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {insights.slice(0, 4).map((insight) => (
          <InsightCard key={insight.id} insight={insight} mallId={mallId} onTrack={() => track({
            eventName: 'tenant_impact_campaign_open',
            tab: 'overview',
            entityType: 'tenant_impact',
            entityId: insight.id,
            entityLabel: insight.title,
            categoryIds: insight.categoryIds,
          })} />
        ))}
      </div>
    </section>
  );
}

function InsightCard({
  insight,
  mallId,
  onTrack,
}: {
  insight: TenantInsight;
  mallId: string;
  onTrack: () => void;
}) {
  const { t, i18n } = useTranslation('mall');
  const stores = insight.stores.slice(0, 5);
  const href = `/mall/campaigns?mall=${encodeURIComponent(mallId)}&impact=${encodeURIComponent(insight.id)}&category=${encodeURIComponent(insight.categoryIds[0] ?? '')}&stores=${encodeURIComponent(stores.map((s) => s.name).join(','))}`;
  return (
    <article className="bo-surface-subtle bo-surface-hover relative overflow-hidden rounded-xl border border-bo-neutral-200/70 p-4 shadow-bo-glass">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-bo-primary-600 via-bo-warning to-bo-accent-600" />
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', moveTone[insight.move])}>
          {t(`shoppermind.tenantImpact.moves.${insight.move}`)}
        </span>
        <span className="rounded-full border border-bo-neutral-200 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-bo-neutral-500">
          {t(`shoppermind.tenantImpact.horizons.${insight.horizon}`)}
        </span>
      </div>
      <h4 className="text-base font-semibold leading-snug tracking-tight text-bo-neutral-950">{insight.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-bo-neutral-700">{insight.need}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {insight.categoryIds.map((id) => (
          <span key={id} className="rounded-full border border-bo-primary-200 bg-bo-primary-50 px-2 py-0.5 text-[10px] font-medium text-bo-primary-800">
            {categoryLabel(id as RetailCategoryId, i18n.language)}
          </span>
        ))}
      </div>
      <dl className="mt-3 grid gap-2 text-xs leading-relaxed text-bo-neutral-700">
        <Field label={t('shoppermind.tenantImpact.recommendation')} body={insight.recommendation} />
        <Field label={t('shoppermind.tenantImpact.focus')} body={insight.focus} />
        <Field label={t('shoppermind.tenantImpact.reduce')} body={insight.reduce} />
      </dl>
      <div className="mt-3 rounded-lg border border-bo-neutral-200/70 bg-white/65 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">
          {t('shoppermind.tenantImpact.storeExamples')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {stores.map((store) => (
            <span key={store.name} title={store.location} className="rounded-md border border-bo-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-bo-neutral-700">
              {store.name}
            </span>
          ))}
        </div>
      </div>
      <Link href={href} onClick={onTrack} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-bo-neutral-950 px-3 py-2 text-xs font-semibold text-white hover:bg-bo-neutral-800">
        <Megaphone size={13} />
        {t('shoppermind.tenantImpact.openCampaign')}
        <ArrowUpRight size={12} />
      </Link>
    </article>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">{label}</dt>
      <dd>{body}</dd>
    </div>
  );
}
