'use client';

import type { FeedbackAggregate } from './types';

export function FeedbackAggregatesStrip({ aggregates }: { aggregates: FeedbackAggregate[] }) {
  if (aggregates.length === 0) return null;
  const top = [...aggregates]
    .sort((a, b) => b.relevant + b.notRelevant - (a.relevant + a.notRelevant))
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {top.map((a) => (
        <div
          key={a.phenomenonId}
          className="bg-white rounded-xl border border-bo-neutral-200 p-3"
        >
          <div className="text-sm font-semibold text-bo-neutral-900 mb-2 truncate" title={a.phenomenonLabel}>
            {a.phenomenonLabel}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-green-700 font-medium">
              👍 {a.relevant}
            </span>
            <span className="inline-flex items-center gap-1 text-red-700 font-medium">
              👎 {a.notRelevant}
            </span>
            <span className="inline-flex items-center gap-1 text-bo-neutral-500">
              💬 {a.commentCount}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
