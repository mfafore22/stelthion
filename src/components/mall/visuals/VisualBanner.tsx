'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getContrastTextColor } from '@/lib/mall/mallIdentity';

export type BannerVisual = string | {
  title?: string;
  primary: string;
  secondary: string;
  accent: string;
};

export function VisualBanner({
  src,
  alt,
  className,
  compact = false,
}: {
  src: BannerVisual;
  alt: string;
  className?: string;
  compact?: boolean;
}) {
  const baseClass = cn(
    'relative w-full overflow-hidden rounded-xl border border-white/70',
    compact ? 'h-16' : 'h-24 sm:h-28',
    className,
  );

  if (typeof src !== 'string') {
    const textColor = getContrastTextColor(src.primary) === 'white' ? '#ffffff' : '#111827';
    return (
      <div className={baseClass} style={{ background: `linear-gradient(135deg, ${src.primary} 0%, ${src.secondary} 100%)` }} aria-label={alt}>
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 24% 20%, ${src.accent} 0%, transparent 34%)` }} />
        <div className="absolute -right-8 top-3 h-28 w-28 rounded-full border-2 opacity-35" style={{ borderColor: textColor }} />
        <div className="absolute right-14 top-8 h-12 w-12 rounded-full border opacity-30" style={{ borderColor: textColor }} />
        {src.title && (
          <div className="absolute inset-x-4 bottom-4 text-base font-semibold tracking-tight" style={{ color: textColor }}>
            {src.title}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/8 via-transparent to-white/8" />
    </div>
  );
}
