'use client';

import { VisualBanner } from '@/components/mall/visuals/VisualBanner';

export function ConciergeBanner({ title }: { title: string }) {
  return (
    <div className="px-4 py-3">
      <VisualBanner
        src={{ title, primary: '#214990', secondary: '#328d2e', accent: '#f3c978' }}
        alt={title}
        compact
      />
    </div>
  );
}
