'use client';

import type { ActivityAggregateItem } from './types';

export function AggregateCard({
  title,
  items,
}: {
  title: string;
  items: ActivityAggregateItem[];
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="rounded-xl border border-bo-neutral-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-bo-neutral-900">{title}</h2>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-sm text-bo-neutral-400">0</div>}
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-bo-neutral-700">{item.label}</span>
              <span className="tabular-nums text-bo-neutral-500">{item.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bo-neutral-100">
              <div
                className="h-full rounded-full bg-bo-primary-600"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
