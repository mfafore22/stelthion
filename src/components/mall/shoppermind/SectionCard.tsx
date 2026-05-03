'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Accent = 'neutral' | 'accent' | 'primary' | 'warning' | 'error';

const ACCENT_STYLES: Record<Accent, { iconBg: string; iconColor: string; border: string }> = {
  neutral: {
    iconBg: 'bg-bo-neutral-100',
    iconColor: 'text-bo-neutral-700',
    border: 'border-bo-neutral-200',
  },
  accent: {
    iconBg: 'bg-bo-info-light',
    iconColor: 'text-bo-info-dark',
    border: 'border-bo-info/30',
  },
  primary: {
    iconBg: 'bg-bo-primary-100',
    iconColor: 'text-bo-primary',
    border: 'border-bo-primary-200',
  },
  warning: {
    iconBg: 'bg-bo-warning-light',
    iconColor: 'text-bo-warning-dark',
    border: 'border-bo-warning/30',
  },
  error: {
    iconBg: 'bg-bo-error-light',
    iconColor: 'text-bo-error-dark',
    border: 'border-bo-error/30',
  },
};

export function SectionCard({
  icon: Icon,
  title,
  accent = 'neutral',
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  accent?: Accent;
  children: React.ReactNode;
  className?: string;
}) {
  const a = ACCENT_STYLES[accent];
  return (
    <div
      className={cn(
        'bo-surface bo-surface-hover rounded-xl border-2 p-5',
        a.border,
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', a.iconBg)}>
          <Icon className={cn('w-4.5 h-4.5 w-[18px] h-[18px]', a.iconColor)} />
        </div>
        <h2 className="text-sm font-semibold text-bo-neutral-950 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="text-sm text-bo-neutral-700 leading-relaxed">{children}</div>
    </div>
  );
}
