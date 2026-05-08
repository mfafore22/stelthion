'use client';

import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { MallIdentityBanner } from '@/components/mall/visuals/MallIdentityBanner';
import { TrendShape } from '@/components/mall/ui/TrendShape';
import { getMallIdentity } from '@/lib/mall/mallIdentity';
import { getMallLogo } from '@/lib/mall/mallLogos';

export function PortfolioPropertyCard({
  mallId,
  name,
  city,
  status,
  metrics,
  actionLabel,
  onClick,
}: {
  mallId: string;
  name: string;
  city: string;
  status: string;
  metrics: Array<{ label: string; value: string; trendPercentage?: number }>;
  actionLabel: string;
  onClick: () => void;
}) {
  const identity = getMallIdentity(mallId);
  const logo = getMallLogo(mallId);
  const metricAccents = [identity.colors.primary, identity.colors.secondary, identity.colors.accent];
  return (
    <button onClick={onClick} className="w-full text-left">
      <article className="bo-surface bo-surface-hover flex h-full flex-col rounded-xl border-2 p-4">
        <MallIdentityBanner
          title={name}
          primary={identity.colors.primary}
          secondary={identity.colors.secondary}
          accent={identity.colors.accent}
        />
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-bo-neutral-200 bg-white">
              {logo ? (
                <Image src={logo} alt={name} width={36} height={36} className="h-9 w-9 object-contain" />
              ) : (
                <span className="text-sm font-semibold text-bo-neutral-700">{name.slice(0, 2)}</span>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold leading-snug text-bo-neutral-950">{name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-bo-neutral-600">
                <MapPin className="h-3.5 w-3.5" />
                <span>{city}</span>
              </div>
            </div>
          </div>
          <span className="rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: `${identity.colors.primary}40`, color: identity.colors.primary, backgroundColor: `${identity.colors.primary}12` }}>
            {status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="bo-surface-subtle bo-surface-hover relative min-h-[82px] overflow-hidden rounded-lg border px-3 py-2.5 shadow-bo-glass"
              style={{ borderColor: `${metricAccents[index % metricAccents.length]}38` }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${metricAccents[index % metricAccents.length]}, ${identity.colors.accent})` }}
              />
              <TrendShape percentageChange={metric.trendPercentage ?? 0} intensity="background" />
              <div className="relative z-10">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-500">{metric.label}</div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-bo-neutral-950">{metric.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-bo-primary-700">
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </article>
    </button>
  );
}
