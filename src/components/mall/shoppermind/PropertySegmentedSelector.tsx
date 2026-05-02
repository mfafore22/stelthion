'use client';

export interface PropertySegmentOption {
  id: string;
  name: string;
}

function displayName(name: string): string {
  return name.split(',')[0]?.trim() || name;
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
    <div className="flex w-full max-w-full flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-bo-neutral-500">
        {label}
      </div>
      <div className="grid w-full max-w-full grid-cols-2 rounded-xl border border-bo-neutral-200 bg-white p-1 shadow-bo-sm">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              title={option.name}
              className={`min-h-9 min-w-0 rounded-lg px-3 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-bo-neutral-950 text-white shadow-bo-sm'
                  : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
              }`}
              aria-pressed={selected}
            >
              <span className="block truncate">{displayName(option.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
