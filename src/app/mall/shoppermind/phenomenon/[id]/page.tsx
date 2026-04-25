'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
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
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  MapPin,
  Globe,
  Tag,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Activity as ActivityIcon,
  Lightbulb,
  Target,
  AlertTriangle,
} from 'lucide-react';
import type {
  PhenomenonDetail,
  PhenomenonLinkRow,
  PhenomenonScoreRow,
  LinkType,
} from '@stelthion/shoppermind-client-types';
import { StateBadge } from '@/components/mall/shoppermind/StateBadge';
import { LifecycleContinuum } from '@/components/mall/shoppermind/LifecycleContinuum';
import { TrajectoryChart } from '@/components/mall/shoppermind/TrajectoryChart';
import { SectionCard } from '@/components/mall/shoppermind/SectionCard';
import { localizePhenomenon } from '@/lib/shoppermind/localize';
import { cn } from '@/lib/utils';

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

  const reload = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(id)}`, {
        credentials: 'include',
      });
      const body = (await res.json()) as DetailResponse;
      if (body.error) setError(body.error);
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shoppermind.errors.network'));
    } finally {
      setFetching(false);
    }
  }, [id, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
          {!fetching && data?.phenomenon && (
            <DetailBody phenomenon={data.phenomenon} onLinkAdded={reload} />
          )}
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

function DetailBody({
  phenomenon: p,
  onLinkAdded,
}: {
  phenomenon: PhenomenonDetail;
  onLinkAdded: () => void | Promise<void>;
}) {
  const { i18n } = useTranslation('mall');
  const firstSeen = new Date(p.firstSeenAt).toLocaleDateString();
  const lastSignal = new Date(p.lastSignalAt).toLocaleDateString();
  const localized = localizePhenomenon(p, i18n.language);
  const latest = p.scores[0] ?? null;
  return (
    <>
      <Header phenomenon={p} label={localized.label} />
      <LifecycleContinuum
        state={p.state}
        compositeScore={latest?.compositeScore ?? p.scores[0]?.compositeScore}
        velocity={latest?.velocity}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <NarrativeSections parsed={localized.parsed} state={p.state} />
          <TrajectoryChart scores={p.scores} />
          <LinksPanel
            linksFrom={p.linksFrom}
            linksTo={p.linksTo}
            selfId={p.id}
            onLinkAdded={onLinkAdded}
          />
          <ScoreHistoryPanel scores={p.scores} />
        </section>
        <aside className="space-y-6">
          <MetaPanel phenomenon={p} firstSeen={firstSeen} lastSignal={lastSignal} />
          <CategoriesPanel categories={p.categories} keywords={p.keywords} />
        </aside>
      </div>
    </>
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
  const hasStructured = parsed.signalCommentary || parsed.retailerImpact;
  const isOpportunity = state === 'ACCELERATING' || state === 'EMERGING';
  const isWatchOut = state === 'FADING' || state === 'DORMANT';

  if (!hasStructured) {
    return (
      <SectionCard icon={Sparkles} title={t('shoppermind.sections.summary')} accent="neutral">
        <p className="whitespace-pre-wrap leading-relaxed">{parsed.summary}</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard icon={Sparkles} title={t('shoppermind.sections.summary')} accent="neutral">
        <p className="whitespace-pre-wrap leading-relaxed">{parsed.summary}</p>
      </SectionCard>
      {parsed.signalCommentary && (
        <SectionCard
          icon={ActivityIcon}
          title={t('shoppermind.sections.signal')}
          accent="accent"
        >
          <p className="whitespace-pre-wrap leading-relaxed">{parsed.signalCommentary}</p>
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
      {isOpportunity && parsed.retailerImpact && (
        <SectionCard
          icon={Target}
          title={t('shoppermind.sections.opportunity')}
          accent="primary"
        >
          <p className="leading-relaxed">{t('shoppermind.sections.opportunityBody')}</p>
        </SectionCard>
      )}
      {isWatchOut && parsed.retailerImpact && (
        <SectionCard
          icon={AlertTriangle}
          title={t('shoppermind.sections.watchOut')}
          accent="error"
        >
          <p className="leading-relaxed">{t('shoppermind.sections.watchOutBody')}</p>
        </SectionCard>
      )}
    </div>
  );
}

const LINK_COLOR: Record<LinkType, string> = {
  CONTRIBUTES_TO: 'text-bo-success-dark bg-bo-success-light border-bo-success/30',
  MANIFESTATION_OF: 'text-bo-accent-dark bg-bo-accent-light border-bo-accent/30',
  ACCELERATES: 'text-bo-info-dark bg-bo-info-light border-bo-info/30',
  PRECEDES: 'text-bo-neutral-700 bg-bo-neutral-100 border-bo-neutral-300',
  CONTRADICTS: 'text-bo-error-dark bg-bo-error-light border-bo-error/30',
};

function LinksPanel({
  linksFrom,
  linksTo,
  selfId,
  onLinkAdded,
}: {
  linksFrom: PhenomenonLinkRow[];
  linksTo: PhenomenonLinkRow[];
  selfId: string;
  onLinkAdded: () => void | Promise<void>;
}) {
  const { t } = useTranslation('mall');
  return (
    <MallCard variant="glass" padding="md">
      <h2 className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-3 font-medium">
        {t('shoppermind.detail.linkGraph')}
      </h2>
      <div className="space-y-4">
        {linksFrom.length === 0 && linksTo.length === 0 && (
          <p className="text-sm text-bo-neutral-500">{t('shoppermind.detail.linkGraphEmpty')}</p>
        )}
        {linksTo.length > 0 && (
          <LinkGroup
            heading={t('shoppermind.detail.upstream')}
            icon={<ArrowDownRight className="w-4 h-4 text-bo-neutral-400" />}
            links={linksTo}
            otherIdKey="fromPhenomenonId"
            selfId={selfId}
          />
        )}
        {linksFrom.length > 0 && (
          <LinkGroup
            heading={t('shoppermind.detail.downstream')}
            icon={<ArrowUpRight className="w-4 h-4 text-bo-neutral-400" />}
            links={linksFrom}
            otherIdKey="toPhenomenonId"
            selfId={selfId}
          />
        )}
        <LinkAuthor selfId={selfId} onLinkAdded={onLinkAdded} />
      </div>
    </MallCard>
  );
}

function LinkAuthor({
  selfId,
  onLinkAdded,
}: {
  selfId: string;
  onLinkAdded: () => void | Promise<void>;
}) {
  const { t } = useTranslation('mall');
  const [open, setOpen] = useState(false);
  const [toPhenomenonId, setToPhenomenonId] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('CONTRIBUTES_TO');
  const [weight, setWeight] = useState('1.0');
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const LINK_TYPES: LinkType[] = [
    'CONTRIBUTES_TO',
    'MANIFESTATION_OF',
    'ACCELERATES',
    'PRECEDES',
    'CONTRADICTS',
  ];

  const reset = () => {
    setToPhenomenonId('');
    setLinkType('CONTRIBUTES_TO');
    setWeight('1.0');
    setRationale('');
    setFormError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmed = toPhenomenonId.trim();
    if (!trimmed) {
      setFormError(t('shoppermind.linkAuthor.errors.targetRequired'));
      return;
    }
    if (trimmed === selfId) {
      setFormError(t('shoppermind.linkAuthor.errors.cannotLinkSelf'));
      return;
    }
    const w = Number(weight);
    if (!Number.isFinite(w) || w < 0 || w > 1) {
      setFormError(t('shoppermind.linkAuthor.errors.weightRange'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/shoppermind/phenomenon/${encodeURIComponent(selfId)}/links`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toPhenomenonId: trimmed,
            linkType,
            weight: w,
            rationale: rationale.trim() || undefined,
          }),
        },
      );
      if (res.status === 403) {
        setFormError(t('shoppermind.linkAuthor.errors.forbidden'));
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setFormError(
          body.error ?? t('shoppermind.linkAuthor.errors.requestFailed', { status: res.status }),
        );
        return;
      }
      reset();
      setOpen(false);
      await onLinkAdded();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('shoppermind.errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-bo-primary hover:text-bo-primary-700 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        {t('shoppermind.linkAuthor.openButton')}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border-2 border-bo-accent/30 bg-bo-accent-light/30 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-bo-accent-dark uppercase tracking-wider">
          {t('shoppermind.linkAuthor.heading')}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-bo-neutral-400 hover:text-bo-neutral-700"
          aria-label={t('shoppermind.linkAuthor.cancel')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs text-bo-neutral-600 space-y-1 block">
          {t('shoppermind.linkAuthor.targetLabel')}
          <input
            type="text"
            value={toPhenomenonId}
            onChange={(e) => setToPhenomenonId(e.target.value)}
            placeholder={t('shoppermind.linkAuthor.targetPlaceholder')}
            className="w-full font-mono text-sm px-2 py-1.5 rounded border border-bo-neutral-300 bg-white"
            disabled={submitting}
          />
        </label>
        <label className="text-xs text-bo-neutral-600 space-y-1 block">
          {t('shoppermind.linkAuthor.typeLabel')}
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as LinkType)}
            className="w-full text-sm px-2 py-1.5 rounded border border-bo-neutral-300 bg-white"
            disabled={submitting}
          >
            {LINK_TYPES.map((v) => (
              <option key={v} value={v}>
                {t(`shoppermind.linkTypes.${v}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-bo-neutral-600 space-y-1 block">
          {t('shoppermind.linkAuthor.weightLabel')}
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full text-sm px-2 py-1.5 rounded border border-bo-neutral-300 bg-white"
            disabled={submitting}
          />
        </label>
        <label className="text-xs text-bo-neutral-600 space-y-1 block md:col-span-2">
          {t('shoppermind.linkAuthor.rationaleLabel')}
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={2}
            placeholder={t('shoppermind.linkAuthor.rationalePlaceholder')}
            className="w-full text-sm px-2 py-1.5 rounded border border-bo-neutral-300 bg-white resize-none"
            disabled={submitting}
          />
        </label>
      </div>
      {formError && (
        <div className="text-xs text-bo-error-dark bg-bo-error-light border border-bo-error/30 rounded px-2 py-1.5">
          {formError}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <MallButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          disabled={submitting}
        >
          {t('shoppermind.linkAuthor.cancel')}
        </MallButton>
        <MallButton type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting
            ? t('shoppermind.linkAuthor.saving')
            : t('shoppermind.linkAuthor.save')}
        </MallButton>
      </div>
    </form>
  );
}

function LinkGroup({
  heading,
  icon,
  links,
  otherIdKey,
  selfId,
}: {
  heading: string;
  icon: React.ReactNode;
  links: PhenomenonLinkRow[];
  otherIdKey: 'fromPhenomenonId' | 'toPhenomenonId';
  selfId: string;
}) {
  const { t } = useTranslation('mall');
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-bo-neutral-500 mb-2">
        {icon}
        <span>{heading}</span>
      </div>
      <ul className="space-y-1.5">
        {links.map((link) => {
          const otherId = link[otherIdKey];
          const isSelf = otherId === selfId;
          return (
            <li key={link.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border',
                  LINK_COLOR[link.linkType],
                )}
              >
                {t(`shoppermind.linkTypes.${link.linkType}`)}
              </span>
              {isSelf ? (
                <span className="font-mono text-xs text-bo-neutral-400">{otherId}</span>
              ) : (
                <Link
                  href={`/mall/shoppermind/phenomenon/${encodeURIComponent(otherId)}`}
                  className="font-mono text-xs text-bo-primary hover:text-bo-primary-700 hover:underline truncate"
                >
                  {otherId}
                </Link>
              )}
              <span className="text-xs text-bo-neutral-400 ml-auto shrink-0">
                w={link.weight.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScoreHistoryPanel({ scores }: { scores: PhenomenonScoreRow[] }) {
  const { t } = useTranslation('mall');
  if (scores.length === 0) return null;
  const recent = scores.slice(0, 14);
  return (
    <MallCard variant="glass" padding="md">
      <h2 className="text-xs uppercase tracking-wider text-bo-neutral-400 mb-3 font-medium">
        {t('shoppermind.detail.recentScoring')}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-bo-neutral-400 text-left">
              <th className="font-normal py-1 pr-3">{t('shoppermind.detail.table.date')}</th>
              <th className="font-normal py-1 pr-3">{t('shoppermind.detail.table.composite')}</th>
              <th className="font-normal py-1 pr-3">
                {t('shoppermind.detail.table.footTraffic')}
              </th>
              <th className="font-normal py-1 pr-3">{t('shoppermind.detail.table.cultural')}</th>
              <th className="font-normal py-1 pr-3">{t('shoppermind.detail.table.velocity')}</th>
              <th className="font-normal py-1 pr-3">{t('shoppermind.detail.table.volume')}</th>
              <th className="font-normal py-1">{t('shoppermind.detail.table.boost')}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-t border-bo-neutral-200/60 text-bo-neutral-700">
                <td className="py-1 pr-3 font-mono">{s.date.slice(0, 10)}</td>
                <td className="py-1 pr-3">{s.compositeScore.toFixed(2)}</td>
                <td className="py-1 pr-3">{s.footTrafficScore.toFixed(2)}</td>
                <td className="py-1 pr-3">{s.culturalScore.toFixed(2)}</td>
                <td className="py-1 pr-3">{s.velocity.toFixed(2)}</td>
                <td className="py-1 pr-3">{s.volume}</td>
                <td className="py-1">{s.linkBoost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            label={t('shoppermind.detail.meta.cultural')}
            value={`${p.culturalScope ? t(`shoppermind.scopes.${p.culturalScope}`) : '—'} · ${p.culturalLocality ?? '—'}`}
          />
        )}
        {(p.footTrafficScope || p.footTrafficLocality) && (
          <MetaRow
            icon={<MapPin className="w-4 h-4 text-bo-neutral-400" />}
            label={t('shoppermind.detail.meta.footTraffic')}
            value={`${p.footTrafficScope ? t(`shoppermind.scopes.${p.footTrafficScope}`) : '—'} · ${p.footTrafficLocality ?? '—'}`}
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
  label: string;
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
