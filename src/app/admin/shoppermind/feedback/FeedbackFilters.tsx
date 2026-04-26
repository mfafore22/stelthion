'use client';

import type { FeedbackAggregate, VerdictFilter, DaysFilter } from './types';

const VERDICT_OPTIONS: Array<{ value: VerdictFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'relevant', label: '👍 Relevant' },
  { value: 'not_relevant', label: '👎 Not relevant' },
];

const DAYS_OPTIONS: Array<{ value: DaysFilter; label: string }> = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
];

export function FeedbackFilters({
  phenomena,
  phenomenonId,
  setPhenomenonId,
  verdict,
  setVerdict,
  days,
  setDays,
}: {
  phenomena: FeedbackAggregate[];
  phenomenonId: string;
  setPhenomenonId: (v: string) => void;
  verdict: VerdictFilter;
  setVerdict: (v: VerdictFilter) => void;
  days: DaysFilter;
  setDays: (v: DaysFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <Field label="Trend">
        <select
          value={phenomenonId}
          onChange={(e) => setPhenomenonId(e.target.value)}
          className="px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-bo-primary-600 bg-white min-w-[220px]"
        >
          <option value="">All trends</option>
          {phenomena.map((p) => (
            <option key={p.phenomenonId} value={p.phenomenonId}>
              {p.phenomenonLabel}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Verdict">
        <div className="inline-flex rounded-lg border border-bo-neutral-200 overflow-hidden bg-white">
          {VERDICT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVerdict(opt.value)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                verdict === opt.value
                  ? 'bg-bo-neutral-950 text-white'
                  : 'text-bo-neutral-700 hover:bg-bo-neutral-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Window">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value) as DaysFilter)}
          className="px-3 py-2 text-sm border border-bo-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-bo-primary-600 bg-white"
        >
          {DAYS_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-wider text-bo-neutral-500 font-semibold">{label}</label>
      {children}
    </div>
  );
}
