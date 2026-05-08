'use client';

import type { ReactNode } from 'react';
import { VisualBanner, type BannerVisual } from './VisualBanner';

export function PageHero({
  icon,
  title,
  body,
  bannerSrc,
  bannerAlt,
  rightSlot,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  bannerSrc: BannerVisual;
  bannerAlt: string;
  rightSlot?: ReactNode;
}) {
  return (
    <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-6">
      <VisualBanner src={bannerSrc} alt={bannerAlt} className="mb-5" />
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bo-primary-100">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-bo-neutral-950">{title}</h1>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-bo-neutral-600">{body}</p>
          </div>
        </div>
        {rightSlot}
      </div>
    </section>
  );
}
