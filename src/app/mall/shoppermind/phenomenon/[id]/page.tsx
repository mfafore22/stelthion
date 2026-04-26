'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallCard } from '@/components/mall/ui/MallCard';
import { MallButton } from '@/components/mall/ui/MallButton';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Tag,
  ChevronRight,
  Sparkles,
  Lightbulb,
  Target,
  AlertTriangle,
  Wand2,
  MessageSquare,
} from 'lucide-react';
import type {
  PhenomenonDetail,
  PhenomenonLinkRow,
} from '@stelthion/shoppermind-client-types';
import { StateBadge } from '@/components/mall/shoppermind/StateBadge';
import { LifecycleContinuum } from '@/components/mall/shoppermind/LifecycleContinuum';
import { TrajectoryChart } from '@/components/mall/shoppermind/TrajectoryChart';
import { SectionCard } from '@/components/mall/shoppermind/SectionCard';
import { MarketStatusGrid } from '@/components/mall/shoppermind/MarketStatusGrid';
import { EvidencePanel } from '@/components/mall/shoppermind/EvidencePanel';
import { CampaignIdeaInline } from '@/components/mall/shoppermind/campaign-idea';
import { TrendFeedback } from '@/components/mall/shoppermind/TrendFeedback';
import { localizePhenomenon } from '@/lib/shoppermind/localize';
import { normalizeScope } from '@/lib/shoppermind/scope';
import { canonicalCity } from '@/lib/shoppermind/cities';
import { MetricTerm } from '@/components/mall/shoppermind/MetricTerm';
import { useSetTrendViewContext, useViewContext } from '@/lib/shoppermind/view-context';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';

interface DetailResponse {
  configured: boolean;
  phenomenon: PhenomenonDetail | null;
  error?: string;
}

export default function PhenomenonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useSession();
  const router = useRouter();
  const { t, i18n } = useTranslation('mall');
  const [data, setData] = useState<DetailResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setError(null);
    fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(id)}`, { credentials: 'include' })
      .then(async (res) => {
        const body = (await res.json()) as DetailResponse;
        if (cancelled) return;
        if (body.error) setError(body.error);
        setData(body);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('shoppermind.errors.network'));
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bo-neutral-50">
        <div className="animate-pulse text-bo-neutral-400 text-sm">{t('shoppermind.loading')}</div>
      </div>
    );
  }
  if (!user) return null;

  const localizedLabel = data?.phenomenon
    ? localizePhenomenon(data.phenomenon, i18n.language).label
    : null;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-bo-neutral-50">
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
          <TopNav phenomenonLabel={localizedLabel} />
          {fetching && (
            <div className="text-sm text-bo-neutral-400 animate-pulse">
              {t('shoppermind.loadingTrend')}
            </div>
          )}
          {!fetching && data && !data.configured && <NotConfigured />}
          {!fetching && data?.configured && error && <ErrorBanner message={error} />}
          {!fetching && data?.configured && !error && !data.phenomenon && <NotFound id={id} />}
          {!fetching && data?.phenomenon && <DetailBody phenomenon={data.phenomenon} />}
        </div>
      </main>
    </>
  );
}

function TopNav({ phenomenonLabel }: { phenomenonLabel: string | null }) {
  const { t } = useTranslation('mall');
  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="flex items-center gap-1.5 text-sm text-bo-neutral-500 min-w-0">
        <Link
          href="/mall/shoppermind"
          className="font-medium text-bo-neutral-700 hover:text-bo-primary transition-colors"
        >
          {t('shoppermind.breadcrumbRoot')}
        </Link>
        {phenomenonLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-bo-neutral-400 shrink-0" />
            <span className="text-bo-neutral-900 truncate font-medium">{phenomenonLabel}</span>
          </>
        )}
      </nav>
      <Link href="/mall/shoppermind" className="shrink-0">
        <MallButton variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
          {t('shoppermind.back')}
        </MallButton>
      </Link>
    </div>
  );
}

function NotConfigured() {
  const { t } = useTranslation('mall');
  return (
    <div className="rounded-xl border-2 border-bo-warning/30 bg-bo-warning-light/40 p-6 text-sm text-bo-warning-dark backdrop-blur-xl">
      {t('shoppermind.notConfigured.detail')}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border-2 border-bo-error/30 bg-bo-error-light/40 p-4 text-sm text-bo-error-dark">
      {message}
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  const { t } = useTranslation('mall');
  return (
    <MallCard variant="glass" padding="md">
      <div className="text-sm text-bo-neutral-500">{t('shoppermind.notFound', { id })}</div>
    </MallCard>
  );
}

function DetailBody({ phenomenon: p }: { phenomenon: PhenomenonDetail }) {
  const { i18n } = useTranslation('mall');
  const { user } = useSession();
  const firstSeen = new Date(p.firstSeenAt).toLocaleDateString();
  const lastSignal = new Date(p.lastSignalAt).toLocaleDateString();
  const localized = localizePhenomenon(p, i18n.language);
  const latest = p.scores[0] ?? null;

  useSetTrendViewContext({
    phenomenonId: p.id,
    label: localized.label,
    state: p.state,
    primaryCountry: p.primaryCountry,
  });

  return (
    <>
      <Header phenomenon={p} label={localized.label} />
      <LifecycleContinuum
        state={p.state}
        compositeScore={latest?.compositeScore ?? p.scores[0]?.compositeScore}
        velocity={latest?.velocity}
      />
      <MarketStatusGrid phenomenonId={p.id} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <NarrativeSections parsed={localized.parsed} state={p.state} />
          <CampaignIdeaSection phenomenon={p} mallId={user?.mallId ?? null} />
          <FeedbackSection phenomenonId={p.id} mallId={user?.mallId ?? null} />
          <TrajectoryChart scores={p.scores} />
          <LinksPanel linksFrom={p.linksFrom} linksTo={p.linksTo} selfId={p.id} />
        </section>
        <aside className="space-y-6">
          <EvidencePanel phenomenonId={p.id} />
          <MetaPanel phenomenon={p} firstSeen={firstSeen} lastSignal={lastSignal} />
          <CategoriesPanel categories={p.categories} keywords={p.keywords} />
        </aside>
      </div>
    </>
  );
}

function FeedbackSection({ phenomenonId, mallId }: { phenomenonId: string; mallId: string | null }) {
  const { t } = useTranslation('mall');
  return (
    <SectionCard icon={MessageSquare} title={t('shoppermind.sections.feedback')} accent="neutral">
      <TrendFeedback phenomenonId={phenomenonId} mallId={mallId} />
    </SectionCard>
  );
}

function CampaignIdeaSection({
  phenomenon,
  mallId,
}: {
  phenomenon: PhenomenonDetail;
  mallId: string | null | undefined;
}) {
  const { t } = useTranslation('mall');
  const view = useViewContext();
  const concierge = useConciergeOptional();
  const handleRefineInChat = () => {
    if (view.value?.kind !== 'shoppermind_trend' || view.value.phenomenonId !== phenomenon.id) {
      view.setValue({
        kind: 'shoppermind_trend',
        phenomenonId: phenomenon.id,
        label: phenomenon.label,
        state: phenomenon.state,
        primaryCountry: phenomenon.primaryCountry,
      });
    }
    concierge?.openPanel();
  };
  return (
    <SectionCard icon={Wand2} title={t('shoppermind.sections.campaignIdea')} accent="primary">
      <CampaignIdeaInline
        phenomenon={phenomenon}
        mallId={mallId}
        variant="full"
        autoGenerate={false}
        onRefineInChat={handleRefineInChat}
      />
    </SectionCard>
  );
}

function Header({ phenomenon: p, label }: { phenomenon: PhenomenonDetail; label: string }) {
  const { t } = useTranslation('mall');
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold text-bo-neutral-950 mb-2 tracking-tight">
          {label}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-bo-neutral-500">
          <StateBadge state={p.state} />
          {p.phenomenonType && (
            <span className="uppercase tracking-wider font-medium bg-bo-neutral-100 text-bo-neutral-700 px-2 py-1 rounded-md border border-bo-neutral-200">
              {t(`shoppermind.phenomenonTypes.${p.phenomenonType}`)}
            </span>
          )}
          {p.lifecycleState && (
            <span className="text-bo-neutral-500">
              · {t(`shoppermind.lifecycleStates.${p.lifecycleState}`)}
            </span>
          )}
          <span className="text-bo-neutral-500">· {p.primaryCountry}</span>
        </div>
      </div>
    </div>
  );
}

function NarrativeSections({
  parsed,
  state,
}: {
  parsed: ReturnType<typeof localizePhenomenon>['parsed'];
  state: PhenomenonDetail['state'];
}) {
  const { t } = useTranslation('mall');
  const isWatchOut = state === 'FADING' || state === 'DORMANT';
  const opportunityCopy =
    parsed.opportunity ||
    (isWatchOut
      ? t('shoppermind.sections.watchOutBody')
      : t('shoppermind.sections.opportunityBody'));

  return (
    <div className="space-y-4">
      {parsed.summary && (
        <SectionCard icon={Sparkles} title={t('shoppermind.sections.summary')} accent="neutral">
          <p className="whitespace-pre-wrap leading-relaxed">{parsed.summary}</p>
        </SectionCard>
      )}
      {parsed.retailerImpact && (
        <SectionCard
          icon={Lightbulb}
          title={t('shoppermind.sections.impact')}
          accent="warning"
        >
          <p className="whitespace-pre-wrap leading-relaxed">{parsed.retailerImpact}</p>
        </SectionCard>
      )}
      {(parsed.retailerImpact || parsed.summary) && (
        <SectionCard
          icon={isWatchOut ? AlertTriangle : Target}
          title={
            isWatchOut
              ? t('shoppermind.sections.watchOut')
              : t('shoppermind.sections.opportunity')
          }
          accent={isWatchOut ? 'error' : 'primary'}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{opportunityCopy}</p>
        </SectionCard>
      )}
    </div>
  );
}

interface RelatedSummary {
  id: string;
  label: string;
  state: PhenomenonDetail['state'];
}

function LinksPanel({
  linksFrom,
  linksTo,
  selfId,
}: {
  linksFrom: PhenomenonLinkRow[];
  linksTo: PhenomenonLinkRow[];
  selfId: string;
}) {
  const { t, i18n } = useTranslation('mall');

  const relatedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const l of linksTo) if (l.fromPhenomenonId !== selfId) ids.add(l.fromPhenomenonId);
    for (const l of linksFrom) if (l.toPhenomenonId !== selfId) ids.add(l.toPhenomenonId);
    return [...ids];
  }, [linksFrom, linksTo, selfId]);

  const [related, setRelated] = useState<Record<string, RelatedSummary>>({});

  useEffect(() => {
    if (relatedIds.length === 0) {
      setRelated({});
      return;
    }
    let cancelled = false;
    Promise.all(
      relatedIds.map((id) =>
        fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(id)}`, {
          credentials: 'include',
        })
          .then((res) => res.json() as Promise<DetailResponse>)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, RelatedSummary> = {};
      for (const body of results) {
        const p = body?.phenomenon;
        if (!p) continue;
        map[p.id] = {
          id: p.id,
          label: localizePhenomenon(p, i18n.language).label,
          state: p.state,
        };
      }
      setRelated(map);
    });
    return () => {
      cancelled = true;
    };
  }, [relatedIds, i18n.language]);

  if (relatedIds.length === 0) return null;

  return (
    <MallCard variant="glass" padding="md">
      <h2 className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-3 font-medium">
        {t('shoppermind.detail.relatedTrends')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {relatedIds.map((id) => {
          const r = related[id];
          return (
            <Link
              key={id}
              href={`/mall/shoppermind/phenomenon/${encodeURIComponent(id)}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-bo-neutral-200 bg-white hover:border-bo-primary hover:shadow-sm transition-all"
            >
              <span className="text-sm font-medium text-bo-neutral-900 truncate">
                {r?.label ?? id}
              </span>
              {r ? (
                <StateBadge state={r.state} className="shrink-0" />
              ) : (
                <span className="text-xs text-bo-neutral-400 shrink-0 animate-pulse">
                  …
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </MallCard>
  );
}

function MetaPanel({
  phenomenon: p,
  firstSeen,
  lastSignal,
}: {
  phenomenon: PhenomenonDetail;
  firstSeen: string;
  lastSignal: string;
}) {
  const { t } = useTranslation('mall');
  return (
    <MallCard variant="glass" padding="md">
      <h2 className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-3 font-medium">
        {t('shoppermind.detail.details')}
      </h2>
      <dl className="text-sm space-y-2.5">
        {p.eventStart && (
          <MetaRow
            icon={<Calendar className="w-4 h-4 text-bo-neutral-400" />}
            label={t('shoppermind.detail.meta.eventStart')}
            value={new Date(p.eventStart).toLocaleDateString()}
          />
        )}
        {p.eventEnd && (
          <MetaRow
            icon={<Calendar className="w-4 h-4 text-bo-neutral-400" />}
            label={t('shoppermind.detail.meta.eventEnd')}
            value={new Date(p.eventEnd).toLocaleDateString()}
          />
        )}
        <MetaRow
          icon={<Calendar className="w-4 h-4 text-bo-neutral-400" />}
          label={t('shoppermind.detail.meta.firstSeen')}
          value={firstSeen}
        />
        <MetaRow
          icon={<Calendar className="w-4 h-4 text-bo-neutral-400" />}
          label={t('shoppermind.detail.meta.lastSignal')}
          value={lastSignal}
        />
        {(p.culturalScope || p.culturalLocality) && (
          <MetaRow
            icon={<Globe className="w-4 h-4 text-bo-neutral-400" />}
            label={
              <MetricTerm tooltip={t('shoppermind.tooltips.cultural')}>
                {t('shoppermind.detail.meta.cultural')}
              </MetricTerm>
            }
            value={`${(() => {
              const norm = normalizeScope(p.culturalScope);
              return norm ? t(`shoppermind.scopes.${norm}`) : '–';
            })()} · ${canonicalCity(p.culturalLocality) ?? '–'}`}
          />
        )}
        {(p.footTrafficScope || p.footTrafficLocality) && (
          <MetaRow
            icon={<MapPin className="w-4 h-4 text-bo-neutral-400" />}
            label={
              <MetricTerm tooltip={t('shoppermind.tooltips.footTraffic')}>
                {t('shoppermind.detail.meta.footTraffic')}
              </MetricTerm>
            }
            value={`${(() => {
              const norm = normalizeScope(p.footTrafficScope);
              return norm ? t(`shoppermind.scopes.${norm}`) : '–';
            })()} · ${canonicalCity(p.footTrafficLocality) ?? '–'}`}
          />
        )}
      </dl>
    </MallCard>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-bo-neutral-500 text-xs uppercase tracking-wider">
        {icon}
        {label}
      </dt>
      <dd className="text-bo-neutral-900 text-right font-medium">{value}</dd>
    </div>
  );
}

function CategoriesPanel({
  categories,
  keywords,
}: {
  categories: string[];
  keywords: string[];
}) {
  const { t } = useTranslation('mall');
  const cats = useMemo(() => categories.filter(Boolean), [categories]);
  const kws = useMemo(() => keywords.filter(Boolean), [keywords]);
  if (cats.length === 0 && kws.length === 0) return null;
  return (
    <MallCard variant="glass" padding="md">
      <h2 className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-3 font-medium">
        {t('shoppermind.detail.tags')}
      </h2>
      {cats.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-bo-neutral-400 mb-1.5">
            {t('shoppermind.detail.categories')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 text-xs bg-bo-primary-100 text-bo-primary-700 px-2 py-0.5 rounded-full border border-bo-primary-200"
              >
                <Tag className="w-3 h-3" />
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      {kws.length > 0 && (
        <div>
          <div className="text-xs text-bo-neutral-400 mb-1.5">
            {t('shoppermind.detail.keywords')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {kws.map((k) => (
              <span
                key={k}
                className="inline-flex items-center text-xs bg-bo-neutral-100 text-bo-neutral-700 px-2 py-0.5 rounded-full border border-bo-neutral-200"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </MallCard>
  );
}
