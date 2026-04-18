'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Circle,
  Pause,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  MapPin,
  Globe,
  Tag,
  Plus,
  X,
} from 'lucide-react';
import type {
  PhenomenonDetail,
  PhenomenonLinkRow,
  PhenomenonScoreRow,
  PhenomenonStateValue,
  LinkType,
} from '@stelthion/shoppermind-client-types';

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
      setError(err instanceof Error ? err.message : 'network error');
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F6F3]">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-[#F8F6F3]">
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
          <Link
            href="/mall/shoppermind"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to ShopperMind
          </Link>
          {fetching && <div className="text-sm text-gray-400 animate-pulse">Loading…</div>}
          {!fetching && data && !data.configured && <NotConfigured />}
          {!fetching && data?.configured && error && <ErrorBanner message={error} />}
          {!fetching && data?.configured && !error && !data.phenomenon && <NotFound id={id} />}
          {!fetching && data?.phenomenon && <DetailBody phenomenon={data.phenomenon} onLinkAdded={reload} />}
        </div>
      </main>
    </>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      ShopperMind service is not configured in this environment.
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
      Phenomenon <code className="font-mono">{id}</code> was not found.
    </div>
  );
}

function DetailBody({
  phenomenon: p,
  onLinkAdded,
}: {
  phenomenon: PhenomenonDetail;
  onLinkAdded: () => void | Promise<void>;
}) {
  const latest = p.scores[0] ?? null;
  const firstSeen = new Date(p.firstSeenAt).toLocaleDateString();
  const lastSignal = new Date(p.lastSignalAt).toLocaleDateString();
  return (
    <>
      <Header phenomenon={p} />
      <MetricsStrip latest={latest} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <Card title="Description">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {p.description}
            </p>
          </Card>
          <LinksPanel
            linksFrom={p.linksFrom}
            linksTo={p.linksTo}
            selfId={p.id}
            onLinkAdded={onLinkAdded}
          />
          <ScoreHistoryPanel scores={p.scores} />
        </section>
        <aside className="space-y-6">
          <MetaPanel
            phenomenon={p}
            firstSeen={firstSeen}
            lastSignal={lastSignal}
          />
          <CategoriesPanel categories={p.categories} keywords={p.keywords} />
        </aside>
      </div>
    </>
  );
}

const STATE_META: Record<
  PhenomenonStateValue,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  EMERGING: { label: 'Emerging', color: 'text-sky-600', icon: Circle },
  ACCELERATING: { label: 'Accelerating', color: 'text-emerald-600', icon: TrendingUp },
  STABLE: { label: 'Stable', color: 'text-gray-500', icon: Activity },
  FADING: { label: 'Fading', color: 'text-amber-600', icon: TrendingDown },
  DORMANT: { label: 'Dormant', color: 'text-gray-400', icon: Pause },
};

function Header({ phenomenon: p }: { phenomenon: PhenomenonDetail }) {
  const meta = STATE_META[p.state];
  const Icon = meta.icon;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">{p.label}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className={`inline-flex items-center gap-1 ${meta.color}`}>
            <Icon className="w-3.5 h-3.5" /> {meta.label}
          </span>
          {p.phenomenonType && (
            <span className="uppercase tracking-wide">{p.phenomenonType}</span>
          )}
          {p.lifecycleState && <span>· {p.lifecycleState}</span>}
          <span>· {p.primaryCountry}</span>
        </div>
      </div>
    </div>
  );
}

function MetricsStrip({ latest }: { latest: PhenomenonScoreRow | null }) {
  if (!latest) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-4 text-xs text-gray-500">
        No scores recorded yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
      <Metric label="Composite" value={latest.compositeScore.toFixed(2)} />
      <Metric label="Foot-traffic" value={latest.footTrafficScore.toFixed(2)} />
      <Metric label="Cultural" value={latest.culturalScore.toFixed(2)} />
      <Metric label="Velocity" value={latest.velocity.toFixed(2)} />
      <Metric label="Acceleration" value={latest.acceleration.toFixed(2)} />
      <Metric label="Volume" value={latest.volume.toString()} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-medium text-gray-800">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-5">
      <h2 className="text-xs uppercase tracking-wide text-gray-400 mb-3">{title}</h2>
      {children}
    </div>
  );
}

const LINK_LABEL: Record<LinkType, string> = {
  CONTRIBUTES_TO: 'Contributes to',
  MANIFESTATION_OF: 'Manifestation of',
  ACCELERATES: 'Accelerates',
  PRECEDES: 'Precedes',
  CONTRADICTS: 'Contradicts',
};

const LINK_COLOR: Record<LinkType, string> = {
  CONTRIBUTES_TO: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  MANIFESTATION_OF: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  ACCELERATES: 'text-sky-600 bg-sky-50 border-sky-200',
  PRECEDES: 'text-gray-600 bg-gray-50 border-gray-200',
  CONTRADICTS: 'text-red-600 bg-red-50 border-red-200',
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
  return (
    <Card title="Link graph">
      <div className="space-y-4">
        {linksFrom.length === 0 && linksTo.length === 0 && (
          <p className="text-sm text-gray-500">No inferred links yet.</p>
        )}
        {linksTo.length > 0 && (
          <LinkGroup
            heading="Upstream — phenomena that link into this one"
            icon={<ArrowDownRight className="w-4 h-4 text-gray-400" />}
            links={linksTo}
            otherIdKey="fromPhenomenonId"
            selfId={selfId}
          />
        )}
        {linksFrom.length > 0 && (
          <LinkGroup
            heading="Downstream — phenomena this one links into"
            icon={<ArrowUpRight className="w-4 h-4 text-gray-400" />}
            links={linksFrom}
            otherIdKey="toPhenomenonId"
            selfId={selfId}
          />
        )}
        <LinkAuthor selfId={selfId} onLinkAdded={onLinkAdded} />
      </div>
    </Card>
  );
}

const LINK_TYPE_OPTIONS: { value: LinkType; label: string }[] = [
  { value: 'CONTRIBUTES_TO', label: 'Contributes to' },
  { value: 'MANIFESTATION_OF', label: 'Manifestation of' },
  { value: 'ACCELERATES', label: 'Accelerates' },
  { value: 'PRECEDES', label: 'Precedes' },
  { value: 'CONTRADICTS', label: 'Contradicts' },
];

function LinkAuthor({
  selfId,
  onLinkAdded,
}: {
  selfId: string;
  onLinkAdded: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [toPhenomenonId, setToPhenomenonId] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('CONTRIBUTES_TO');
  const [weight, setWeight] = useState('1.0');
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      setFormError('Target phenomenon ID required');
      return;
    }
    if (trimmed === selfId) {
      setFormError('Cannot link a phenomenon to itself');
      return;
    }
    const w = Number(weight);
    if (!Number.isFinite(w) || w < 0 || w > 1) {
      setFormError('Weight must be between 0 and 1');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/shoppermind/phenomenon/${encodeURIComponent(selfId)}/links`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhenomenonId: trimmed,
          linkType,
          weight: w,
          rationale: rationale.trim() || undefined,
        }),
      });
      if (res.status === 403) {
        setFormError('ADMIN role required to author links');
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setFormError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      reset();
      setOpen(false);
      await onLinkAdded();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Author link (admin)
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-indigo-700 uppercase tracking-wide">
          New link
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs text-gray-600 space-y-1 block">
          Target phenomenon ID
          <input
            type="text"
            value={toPhenomenonId}
            onChange={(e) => setToPhenomenonId(e.target.value)}
            placeholder="phenomenon-id"
            className="w-full font-mono text-sm px-2 py-1.5 rounded border border-gray-300 bg-white"
            disabled={submitting}
          />
        </label>
        <label className="text-xs text-gray-600 space-y-1 block">
          Link type
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as LinkType)}
            className="w-full text-sm px-2 py-1.5 rounded border border-gray-300 bg-white"
            disabled={submitting}
          >
            {LINK_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-600 space-y-1 block">
          Weight (0–1)
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full text-sm px-2 py-1.5 rounded border border-gray-300 bg-white"
            disabled={submitting}
          />
        </label>
        <label className="text-xs text-gray-600 space-y-1 block md:col-span-2">
          Rationale (optional)
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={2}
            placeholder="Why is this link correct?"
            className="w-full text-sm px-2 py-1.5 rounded border border-gray-300 bg-white resize-none"
            disabled={submitting}
          />
        </label>
      </div>
      {formError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {formError}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 px-4 py-1.5 rounded font-medium"
        >
          {submitting ? 'Saving…' : 'Save link'}
        </button>
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
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
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
                className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${LINK_COLOR[link.linkType]}`}
              >
                {LINK_LABEL[link.linkType]}
              </span>
              {isSelf ? (
                <span className="font-mono text-xs text-gray-400">{otherId}</span>
              ) : (
                <Link
                  href={`/mall/shoppermind/phenomenon/${encodeURIComponent(otherId)}`}
                  className="font-mono text-xs text-indigo-600 hover:text-indigo-700 hover:underline truncate"
                >
                  {otherId}
                </Link>
              )}
              <span className="text-xs text-gray-400 ml-auto shrink-0">
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
  if (scores.length === 0) return null;
  const recent = scores.slice(0, 14);
  return (
    <Card title="Recent scoring">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 text-left">
              <th className="font-normal py-1 pr-3">Date</th>
              <th className="font-normal py-1 pr-3">Composite</th>
              <th className="font-normal py-1 pr-3">Foot-traffic</th>
              <th className="font-normal py-1 pr-3">Cultural</th>
              <th className="font-normal py-1 pr-3">Velocity</th>
              <th className="font-normal py-1 pr-3">Volume</th>
              <th className="font-normal py-1">Boost</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id} className="border-t border-gray-50 text-gray-700">
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
    </Card>
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
  return (
    <Card title="Details">
      <dl className="text-sm space-y-2.5">
        {p.eventStart && (
          <MetaRow
            icon={<Calendar className="w-4 h-4 text-gray-400" />}
            label="Event start"
            value={new Date(p.eventStart).toLocaleDateString()}
          />
        )}
        {p.eventEnd && (
          <MetaRow
            icon={<Calendar className="w-4 h-4 text-gray-400" />}
            label="Event end"
            value={new Date(p.eventEnd).toLocaleDateString()}
          />
        )}
        <MetaRow
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          label="First seen"
          value={firstSeen}
        />
        <MetaRow
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          label="Last signal"
          value={lastSignal}
        />
        {(p.culturalScope || p.culturalLocality) && (
          <MetaRow
            icon={<Globe className="w-4 h-4 text-gray-400" />}
            label="Cultural"
            value={`${p.culturalScope ?? '—'} · ${p.culturalLocality ?? '—'}`}
          />
        )}
        {(p.footTrafficScope || p.footTrafficLocality) && (
          <MetaRow
            icon={<MapPin className="w-4 h-4 text-gray-400" />}
            label="Foot traffic"
            value={`${p.footTrafficScope ?? '—'} · ${p.footTrafficLocality ?? '—'}`}
          />
        )}
      </dl>
    </Card>
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
      <dt className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide">
        {icon}
        {label}
      </dt>
      <dd className="text-gray-800 text-right">{value}</dd>
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
  const cats = useMemo(() => categories.filter(Boolean), [categories]);
  const kws = useMemo(() => keywords.filter(Boolean), [keywords]);
  if (cats.length === 0 && kws.length === 0) return null;
  return (
    <Card title="Tags">
      {cats.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1.5">Categories</div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100"
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
          <div className="text-xs text-gray-400 mb-1.5">Keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {kws.map((k) => (
              <span
                key={k}
                className="inline-flex items-center text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
