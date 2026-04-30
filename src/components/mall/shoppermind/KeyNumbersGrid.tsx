import type { MegaKeyNumber } from '@/lib/shoppermind/megaScenario';

export function KeyNumbersGrid({ numbers, label }: { numbers: MegaKeyNumber[]; label: string }) {
  if (!numbers || numbers.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg bg-bo-neutral-50/60 border border-bo-neutral-200/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-bo-neutral-500 mb-2">
        {label}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {numbers.map((n, i) => (
          <div key={i} className="min-w-0">
            <div className="text-base font-semibold text-bo-neutral-950 tabular-nums leading-tight truncate">
              {n.value}
            </div>
            <div className="text-[11px] text-bo-neutral-700 leading-snug mt-0.5">{n.label}</div>
            {n.hint && <div className="text-[10px] text-bo-neutral-500 leading-snug mt-0.5">{n.hint}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
