'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricTermProps {
  children: ReactNode;
  tooltip: string;
  className?: string;
}

export function MetricTerm({ children, tooltip, className }: MetricTermProps) {
  return (
    <span className={cn('relative inline-flex group cursor-help', className)}>
      <span className="border-b border-dotted border-bo-neutral-400/70 group-hover:border-bo-primary">
        {children}
      </span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5',
          'whitespace-normal w-max max-w-[260px] z-50',
          'px-2.5 py-1.5 rounded-md bg-bo-neutral-900 text-white text-xs leading-snug font-normal normal-case tracking-normal',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'shadow-lg',
        )}
      >
        {tooltip}
      </span>
    </span>
  );
}
