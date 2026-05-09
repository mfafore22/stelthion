import type { LucideIcon } from 'lucide-react';

export function VenueMetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="bo-surface-subtle bo-surface-hover rounded-xl border border-bo-neutral-200/70 p-4 shadow-bo-glass">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-bo-neutral-500">{label}</span>
        <Icon className="h-5 w-5 text-bo-primary-700" />
      </div>
      <div className="text-3xl font-semibold tracking-tight text-bo-neutral-950">{value}</div>
      <div className="mt-3 rounded-lg border border-bo-neutral-200/60 bg-bo-neutral-100/70 px-3 py-2 text-xs leading-relaxed text-bo-neutral-600">
        {hint}
      </div>
    </article>
  );
}
