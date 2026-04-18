'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { Brain, TrendingUp, TrendingDown, Activity, Circle, Pause } from 'lucide-react';
import type {
  MarketDetail,
  PhenomenonSummary,
  SignalOfTheDay,
  PhenomenonStateValue,
} from '@stelthion/shoppermind-client-types';

interface OverviewResponse {
  configured: boolean;
  marketId: string;
  market: MarketDetail | null;
  phenomena: PhenomenonSummary[];
  signalOfTheDay: SignalOfTheDay | null;
  error?: string;
}

export default function ShopperMindPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.mallId) return;
    let cancelled = false;
    setFetching(true);
    setError(null);
    fetch(`/api/shoppermind/overview?mallId=${encodeURIComponent(user.mallId)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const body = (await res.json()) as OverviewResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok && !body.configured) {
          setError(body.error ?? 'Service unavailable');
        } else if (body.error) {
          setError(body.error);
        }
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
  }, [user?.mallId]);

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
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
          <Header market={data?.market ?? null} marketId={data?.marketId ?? null} />
          {fetching && <div className="text-sm text-gray-400 animate-pulse">Loading trends…</div>}
          {!fetching && data && !data.configured && <NotConfigured marketId={data.marketId} />}
          {!fetching && data?.configured && error && <ErrorBanner message={error} />}
          {!fetching && data?.configured && !error && (
            <>
              <SignalOfTheDayCard sotd={data.signalOfTheDay} />
              <PhenomenaGrid phenomena={data.phenomena} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Header({ market, marketId }: { market: MarketDetail | null; marketId: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Brain className="w-8 h-8 text-indigo-500" />
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">ShopperMind</h1>
        <p className="text-sm text-gray-500">
          {market
            ? `${market.displayName} · ${market.industryFocus}`
            : marketId
              ? `Market: ${marketId}`
              : 'Trend engine'}
        </p>
      </div>
    </div>
  );
}

function NotConfigured({ marketId }: { marketId: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      <div className="font-medium mb-1">Service not configured for this environment</div>
      <div className="text-amber-700">
        Set <code className="font-mono">SHOPPERMIND_SERVICE_URL</code> and{' '}
        <code className="font-mono">SHOPPERMIND_SERVICE_TOKEN</code> to connect. This mall would
        resolve to <code className="font-mono">{marketId}</code>.
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      Trend service unreachable: {message}
    </div>
  );
}

function SignalOfTheDayCard({ sotd }: { sotd: SignalOfTheDay | null }) {
  if (!sotd) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-6">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Signal of the Day</div>
        <div className="text-sm text-gray-500">
          No signal published yet for this market today.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-6">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
        Signal of the Day · {sotd.date.slice(0, 10)}
      </div>
      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{sotd.narrative}</p>
    </div>
  );
}

function PhenomenaGrid({ phenomena }: { phenomena: PhenomenonSummary[] }) {
  if (phenomena.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-6 text-sm text-gray-500">
        No phenomena tracked for this market yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {phenomena.map((p) => (
        <PhenomenonCard key={p.id} phenomenon={p} />
      ))}
    </div>
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

function PhenomenonCard({ phenomenon }: { phenomenon: PhenomenonSummary }) {
  const meta = STATE_META[phenomenon.state];
  const Icon = meta.icon;
  return (
    <Link
      href={`/mall/shoppermind/phenomenon/${encodeURIComponent(phenomenon.id)}`}
      className="rounded-xl bg-white border border-gray-100 p-5 block hover:border-indigo-200 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-medium text-gray-800 leading-snug">{phenomenon.label}</h3>
        <div className={`flex items-center gap-1 text-xs ${meta.color}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{meta.label}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 line-clamp-3 mb-3">{phenomenon.description}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Score {phenomenon.compositeScore.toFixed(2)}</span>
        {phenomenon.phenomenonType && (
          <span className="uppercase tracking-wide">{phenomenon.phenomenonType}</span>
        )}
        {phenomenon.lifecycleState && <span>· {phenomenon.lifecycleState}</span>}
      </div>
    </Link>
  );
}
