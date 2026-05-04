'use client';

import type { ReactNode } from 'react';

type AttachmentTone = 'blue' | 'green' | 'orange' | 'neutral';

const toneClass: Record<AttachmentTone, string> = {
  blue: 'from-bo-primary-700 via-bo-info-dark to-bo-primary-500',
  green: 'from-bo-success-dark via-bo-primary-700 to-bo-success',
  orange: 'from-bo-warning-dark via-bo-accent to-bo-primary-700',
  neutral: 'from-bo-neutral-900 via-bo-primary-800 to-bo-neutral-500',
};

export function AttachmentShell({
  title,
  tone = 'blue',
  children,
}: {
  title: string;
  tone?: AttachmentTone;
  children: ReactNode;
}) {
  return (
    <div className="bo-surface-subtle bo-surface-hover mt-2 overflow-hidden rounded-xl border border-bo-primary-200/50 shadow-bo-glass">
      <div className={`h-1.5 bg-gradient-to-r ${toneClass[tone]}`} />
      <div className="p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}
