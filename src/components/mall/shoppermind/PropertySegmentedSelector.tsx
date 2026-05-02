'use client';

export interface PropertySegmentOption {
  id: string;
  name: string;
}

export function PropertySegmentedSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: PropertySegmentOption[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-bo-neutral-500">
        {label}
      </div>
      <div className="inline-flex w-full rounded-xl border border-bo-neutral-200 bg-white p-1 shadow-bo-sm sm:w-auto">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-medium transition-colors sm:flex-none ${
                selected
                  ? 'bg-bo-neutral-950 text-white shadow-bo-sm'
                  : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
              }`}
              aria-pressed={selected}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
