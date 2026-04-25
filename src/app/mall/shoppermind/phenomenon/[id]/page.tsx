'use client';

import { use, useEffect, useMemo, useState } from 'react';
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
        if (!cancelled) setError(err instanceof Error ? err.message : 'network error');
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
          {!fetching && data?.phenomenon && <DetailBody phenomenon={data.phenomenon} />}
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

function DetailBody({ phenomenon: p }: { phenomenon: PhenomenonDetail }) {
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
}: {
  linksFrom: PhenomenonLinkRow[];
  linksTo: PhenomenonLinkRow[];
  selfId: string;
}) {
  if (linksFrom.length === 0 && linksTo.length === 0) {
    return (
      <Card title="Link graph">
        <p className="text-sm text-gray-500">No inferred links yet.</p>
      </Card>
    );
  }
  return (
    <Card title="Link graph">
      <div className="space-y-4">
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
      </div>
    </Card>
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
