'use client';

import Link from 'next/link';
import type { FeedbackRow } from './types';

const VERDICT_STYLES: Record<string, string> = {
  relevant: 'bg-green-100 text-green-700',
  not_relevant: 'bg-red-100 text-red-700',
};

export function FeedbackTable({ rows }: { rows: FeedbackRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-bo-neutral-200 p-6 text-sm text-bo-neutral-400">
        No feedback rows match the current filters.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-bo-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-bo-neutral-100">
          <tr>
            <Th>When</Th>
            <Th>Trend</Th>
            <Th>Verdict</Th>
            <Th>Comment</Th>
            <Th>User</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-bo-neutral-100">
              <td className="px-4 py-2 text-bo-neutral-500 text-xs whitespace-nowrap">
                {new Date(r.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-2 max-w-[220px]">
                <Link
                  href={`/mall/shoppermind/phenomenon/${encodeURIComponent(r.phenomenonId)}`}
                  className="font-medium text-bo-neutral-900 hover:text-bo-primary truncate block"
                  title={r.phenomenonLabel}
                >
                  {r.phenomenonLabel}
                </Link>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                    VERDICT_STYLES[r.verdict] ?? 'bg-bo-neutral-100 text-bo-neutral-700'
                  }`}
                >
                  {r.verdict === 'relevant' ? '👍 relevant' : r.verdict === 'not_relevant' ? '👎 not relevant' : r.verdict}
                </span>
              </td>
              <td className="px-4 py-2 text-bo-neutral-700 max-w-[420px]">
                {r.note ? (
                  <span className="whitespace-pre-wrap">{r.note}</span>
                ) : (
                  <span className="text-bo-neutral-300">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-bo-neutral-500 text-xs font-mono">
                {r.userId.slice(0, 10)}…
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">{children}</th>;
}
