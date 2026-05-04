'use client';

import { getContrastTextColor } from '@/lib/mall/mallIdentity';

export function MallIdentityBanner({
  title,
  primary,
  secondary,
  accent,
}: {
  title: string;
  primary: string;
  secondary: string;
  accent: string;
}) {
  const textColor = getContrastTextColor(primary) === 'white' ? '#ffffff' : '#111827';
  return (
    <div
      className="relative h-24 overflow-hidden rounded-xl border border-white/70"
      style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
    >
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 24% 20%, ${accent} 0%, transparent 34%)` }} />
      <div className="absolute -right-8 top-3 h-28 w-28 rounded-full border-2 opacity-35" style={{ borderColor: textColor }} />
      <div className="absolute right-14 top-8 h-12 w-12 rounded-full border opacity-30" style={{ borderColor: textColor }} />
      <div className="absolute inset-x-4 bottom-4">
        <div className="text-base font-semibold tracking-tight" style={{ color: textColor }}>
          {title}
        </div>
      </div>
    </div>
  );
}
