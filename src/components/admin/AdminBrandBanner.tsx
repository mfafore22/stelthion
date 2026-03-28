'use client';

import useSWR from 'swr';
import { useAdminMall } from '@/lib/hooks/useAdminMall';
import { getMallIdentity, getContrastTextColor } from '@/lib/mall/mallIdentity';

interface MallInfo {
  mallId: string;
  name: string;
  city: string;
  status: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Admin brand banner — always reflects the currently selected mall operator.
 * Visual identity (colors, gradient, logo) from brandProfiles.json.
 * Mall name + city from the DB via /api/admin/malls.
 *
 * When a new operator is onboarded, add their brand profile to
 * data/malls/brandProfiles.json and their Mall row in the DB.
 * The banner will pick up both automatically on selection.
 */
export function AdminBrandBanner() {
  const { activeMallId } = useAdminMall();
  const identity = getMallIdentity(activeMallId);
  const textColor = getContrastTextColor(identity.colors.primary);

  const { data: malls } = useSWR<MallInfo[]>('/api/admin/malls', fetcher);
  const activeMall = malls?.find((m) => m.mallId === activeMallId);

  return (
    <div
      className="px-6 py-4 shrink-0"
      style={{
        background: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-5">
          <div className="flex gap-2.5">
            <div
              className="w-3 h-3 rounded-full shadow-bo-sm"
              style={{ backgroundColor: identity.colors.accent }}
            />
            <div
              className="w-3 h-3 rounded-full shadow-bo-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            />
            <div
              className="w-3 h-3 rounded-full shadow-bo-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
            />
          </div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: textColor }}
          >
            {activeMall?.name ?? identity.name}
          </h2>
          {activeMall?.city && (
            <span
              className="text-sm px-4 py-1.5 rounded-md font-medium tracking-wide"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: textColor,
              }}
            >
              {activeMall.city}
            </span>
          )}
        </div>
        {identity.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={identity.logo}
            alt={activeMall?.name ?? identity.name}
            style={{ height: '52px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
          />
        )}
      </div>
    </div>
  );
}
