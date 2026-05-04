'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  subtitle?: string;
  timespan?: string;
  defaultOpen?: boolean;
  topMedia?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
  toneClassName?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  timespan,
  defaultOpen = false,
  topMedia,
  rightSlot,
  children,
  toneClassName,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useTranslation('mall');
  const aria = open ? t('shoppermind.section.collapse') : t('shoppermind.section.expand');
  return (
    <section className={`bo-surface rounded-2xl border-2 ${toneClassName ?? ''}`}>
      {topMedia && <div className="px-4 pt-4">{topMedia}</div>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={aria}
        className="w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-colors hover:bg-white/30"
      >
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-bo-neutral-950 tracking-tight">{title}</h2>
            {timespan && (
              <span className="text-xs font-medium text-bo-neutral-500 tabular-nums">{timespan}</span>
            )}
          </div>
          {subtitle && <p className="text-xs text-bo-neutral-600 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {rightSlot}
          <ChevronDown
            size={18}
            className={`text-bo-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </section>
  );
}
