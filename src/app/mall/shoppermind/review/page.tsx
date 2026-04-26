'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { Check, X, AlertCircle, Clock, Shield } from 'lucide-react';
import type { ReviewItemRow, ReviewStatus } from '@stelthion/shoppermind-client-types';

interface ReviewListResponse {
  configured: boolean;
  marketId: string;
  items: ReviewItemRow[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

const STATUS_TABS: { key: ReviewStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'EXPIRED', label: 'Expired' },
];

export default function ReviewQueuePage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<ReviewStatus>('PENDING');
  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  const load = useCallback(
    async (nextStatus: ReviewStatus) => {
      if (!user?.mallId) return;
      setFetching(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/shoppermind/review?mallId=${encodeURIComponent(user.mallId)}&status=${nextStatus}`,
          { credentials: 'include' },
        );
        if (res.status === 403) {
          setForbidden(true);
          setData(null);
          return;
        }
        const body = (await res.json()) as ReviewListResponse;
        if (body.error) setError(body.error);
        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'network error');
      } finally {
        setFetching(false);
      }
    },
    [user?.mallId],
  );

  useEffect(() => {
    if (user?.mallId) void load(status);
  }, [user?.mallId, status, load]);

  const handleAction = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      setActioning(id);
      try {
        const note = action === 'reject' ? window.prompt('Optional rejection note:') ?? undefined : undefined;
        const res = await fetch(`/api/shoppermind/review/${encodeURIComponent(id)}/${action}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Failed to ${action}`);
        } else {
          void load(status);
        }
      } finally {
        setActioning(null);
      }
    },
    [load, status],
  );

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
          <Header marketId={data?.marketId ?? null} total={data?.total ?? 0} />
          {forbidden ? (
            <ForbiddenState />
          ) : (
            <>
              <StatusTabs current={status} onChange={setStatus} />
              {fetching && <div className="text-sm text-gray-400 animate-pulse">Loading items…</div>}
              {!fetching && data && !data.configured && <NotConfigured />}
              {!fetching && data?.configured && error && <ErrorBanner message={error} />}
              {!fetching && data?.configured && !error && (
                <ReviewList
                  items={data.items}
                  onAction={handleAction}
                  actioning={actioning}
                  allowActions={status === 'PENDING'}
                />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Header({ marketId, total }: { marketId: string | null; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <Shield className="w-8 h-8 text-indigo-500" />
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Review Queue</h1>
        <p className="text-sm text-gray-500">
          {marketId ? `${marketId} · ${total} item${total === 1 ? '' : 's'}` : '–'}
        </p>
      </div>
    </div>
  );
}

function StatusTabs({
  current,
  onChange,
}: {
  current: ReviewStatus;
  onChange: (s: ReviewStatus) => void;
}) {
  return (
    <div className="inline-flex bg-white rounded-xl border border-gray-100 p-1">
      {STATUS_TABS.map((tab) => {
        const active = tab.key === current;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              active
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ForbiddenState() {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
      <div className="font-medium mb-1">Admin role required</div>
      <div>
        Your account does not have ADMIN privileges. Contact an administrator if you need access to
        the review queue.
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      <div className="font-medium mb-1">Service not configured</div>
      <div className="text-amber-700">
        Set <code className="font-mono">SHOPPERMIND_SERVICE_URL</code> and{' '}
        <code className="font-mono">SHOPPERMIND_SERVICE_TOKEN</code> to enable the review queue.
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function ReviewList({
  items,
  onAction,
  actioning,
  allowActions,
}: {
  items: ReviewItemRow[];
  onAction: (id: string, action: 'approve' | 'reject') => void;
  actioning: string | null;
  allowActions: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-8 text-center text-sm text-gray-500">
        Nothing in this queue right now.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ReviewCard
          key={item.id}
          item={item}
          onAction={onAction}
          actioning={actioning === item.id}
          allowActions={allowActions}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  item,
  onAction,
  actioning,
  allowActions,
}: {
  item: ReviewItemRow;
  onAction: (id: string, action: 'approve' | 'reject') => void;
  actioning: boolean;
  allowActions: boolean;
}) {
  const phenomenon = item.phenomenon;
  const created = useMemo(() => new Date(item.createdAt).toLocaleString(), [item.createdAt]);
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-800 truncate">
            {phenomenon?.label ?? `Phenomenon ${item.phenomenonId}`}
          </h3>
          {phenomenon?.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{phenomenon.description}</p>
          )}
        </div>
        <StatusPill status={item.status} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" /> {created}
        </span>
        <span>Decision: {item.decision}</span>
        {phenomenon?.phenomenonType && <span>· {phenomenon.phenomenonType}</span>}
        {phenomenon?.lifecycleState && <span>· {phenomenon.lifecycleState}</span>}
      </div>
      {item.reasons.length > 0 && (
        <ul className="text-xs text-gray-500 mb-3 list-disc list-inside space-y-0.5">
          {item.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {item.narrativeDraft && (
        <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3 whitespace-pre-wrap">
          {item.narrativeDraft}
        </div>
      )}
      {item.resolutionNote && (
        <div className="text-xs text-gray-500 mb-3">
          Note: {item.resolutionNote} {item.resolvedBy && <span>· {item.resolvedBy}</span>}
        </div>
      )}
      {allowActions && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(item.id, 'approve')}
            disabled={actioning}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm px-3 py-1.5 rounded-lg transition"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => onAction(item.id, 'reject')}
            disabled={actioning}
            className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 border border-gray-200 text-sm px-3 py-1.5 rounded-lg transition"
          >
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<ReviewStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-gray-50 text-gray-500 border-gray-200',
};

function StatusPill({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
