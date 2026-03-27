'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from '@/lib/i18n/hooks';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallKPICard } from '@/components/mall/ui/MallKPICard';
import { MallCard } from '@/components/mall/ui/MallCard';
import { Button } from '@/components/ui/button';
import { getMallIdentity } from '@/lib/mall/mallIdentity';
import { getMallBrandColors } from '@/lib/mall/mallDatabase';
import { getOperatorLogoOrFallback } from '@/lib/mall/operatorLogos';
import { getCurrentFootfall } from '@/lib/data/footfall';

const TENANT_MAP: Record<string, string> = {
  'koy-ideapark-ab': 'Koy Ideapark Ab',
};

const ALL_PROPERTIES = [
  {
    id: 'ideapark',
    name: 'Ideapark Lempäälä',
    city: 'Lempäälä',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 7500000,
    annualSales: 450000000,
    coordinates: [23.7987, 61.3615] as [number, number],
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `€${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toLocaleString();
}

function formatVisitors(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  if (num >= 1000000) {
    return `€${(num / 1000000).toFixed(0)}M`;
  }
  return `€${num.toLocaleString()}`;
}

const STATUS_ACCENTS: Record<string, { badgeBg: string; badgeText: string }> = {
  live: { badgeBg: 'bg-[#d1fae5]', badgeText: 'text-[#047857]' },
  beta: { badgeBg: 'bg-[#fff4e6]', badgeText: 'text-[#b55600]' },
  alpha: { badgeBg: 'bg-[#e7f1ff]', badgeText: 'text-[#1c64f2]' },
  planned: { badgeBg: 'bg-[#eef2f7]', badgeText: 'text-[#475569]' },
};

const getPortfolioKPIs = (t: (key: string) => string) => {
  const footfall = getCurrentFootfall();
  return [
    {
      label: t('mall:portfolio.currentVisitors'),
      value: formatVisitors(footfall.currentVisitors),
      delta: `+${footfall.vsPlanned.toFixed(1)}% ${t('mall:portfolio.vsPlan')}`,
      deltaType: 'positive' as const,
      accent: 'green' as const,
      trendPercentage: footfall.vsPlanned,
    },
    {
      label: t('mall:portfolio.dwellTime'),
      value: `${footfall.dwellTimeMinutes} min`,
      delta: `+3.5% ${t('mall:portfolio.vsBaseline')}`,
      deltaType: 'positive' as const,
      accent: 'blue' as const,
      trendPercentage: 3.5,
    },
    {
      label: t('mall:portfolio.conversionRate'),
      value: `${footfall.conversionRate.toFixed(1)}%`,
      delta: `+1.8% ${t('mall:portfolio.vsLastWeek')}`,
      deltaType: 'positive' as const,
      accent: 'orange' as const,
      trendPercentage: 1.8,
    },
  ];
};

export default function TenantPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: sessionLoading } = useSession();
  const { t } = useTranslation(['mall', 'kpi']);

  const tenantId = params?.tenantId as string | undefined;
  const tenantName = tenantId ? TENANT_MAP[tenantId] : undefined;

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push('/mall/login');
    }
  }, [sessionLoading, user, router]);

  // Route guard: validate tenant slug matches user's company
  useEffect(() => {
    if (!sessionLoading && user && tenantId) {
      const userTenantId = Object.entries(TENANT_MAP).find(
        ([, name]) => name === user.companyName
      )?.[0];

      if (userTenantId && tenantId !== userTenantId) {
        router.push(`/tenant/${userTenantId}/portfolio`);
      }
    }
  }, [sessionLoading, user, tenantId, router]);

  const authorizedProperties = useMemo(() => {
    if (!user || !tenantName) return [];

    if (tenantName === 'Koy Ideapark Ab') {
      return ALL_PROPERTIES.filter(property => property.id === 'ideapark');
    }

    return [];
  }, [user, tenantName]);

  const tenantStats = useMemo(() => {
    const totalProperties = authorizedProperties.length;
    const totalAnnualVisitors = authorizedProperties.reduce((sum, p) => sum + p.annualVisitors, 0);
    const totalAnnualSales = authorizedProperties.reduce((sum, p) => sum + p.annualSales, 0);
    const companyName = tenantName || '';

    return {
      propertyCount: totalProperties,
      annualVisitors: totalAnnualVisitors,
      annualSales: totalAnnualSales,
      companyName,
    };
  }, [authorizedProperties, tenantName]);

  const operatorLogo = getOperatorLogoOrFallback(tenantStats.companyName);

  const handleMallClick = (mallId: string) => {
    router.push(`/mall/${mallId}`);
  };

  if (sessionLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-bo-neutral-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bo-beige-100">
      <MallLeftNav
        managementCompanyId={tenantId || ''}
        onNavigate={(itemId) => console.log(`Navigate to: ${itemId}`)}
      />

      <MallTopBar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <main className="ml-[80px] mt-[80px] p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Management Company Header */}
          <div className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-8 flex flex-col gap-6 bg-bo-gradient-muted">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 relative bg-bo-neutral-50 rounded-lg border border-bo-neutral-200 shadow-bo-sm flex items-center justify-center overflow-hidden">
                  {operatorLogo.type === 'image' ? (
                    <Image
                      src={operatorLogo.value}
                      alt={`${tenantStats.companyName} logo`}
                      fill
                      sizes="56px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-bo-primary-600 font-bold text-2xl">
                      {operatorLogo.value}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
                    {tenantStats.companyName}
                  </h1>
                  <p className="text-sm text-bo-neutral-600 leading-relaxed">
                    {t('mall:portfolio.propertyOperator')} • {t('mall:portfolio.shoppingCenters', { count: tenantStats.propertyCount })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 text-right">
                <div className="text-right">
                  <div className="text-2xl font-bold text-bo-neutral-950 tracking-tight">
                    {tenantStats.propertyCount}
                  </div>
                  <div className="text-xs text-bo-neutral-600 uppercase tracking-wider">
                    {t('mall:portfolio.property', { count: tenantStats.propertyCount })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-bo-neutral-950 tracking-tight">
                    {formatVisitors(tenantStats.annualVisitors)}
                  </div>
                  <div className="text-xs text-bo-neutral-600 uppercase tracking-wider">
                    {t('mall:portfolio.annualVisitors')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-bo-neutral-950 tracking-tight">
                    {formatNumber(tenantStats.annualSales)}
                  </div>
                  <div className="text-xs text-bo-neutral-600 uppercase tracking-wider">
                    {t('mall:portfolio.annualSales')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {getPortfolioKPIs(t).map((kpi, index) => (
              <MallKPICard
                key={index}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                deltaType={kpi.deltaType}
                accent={kpi.accent}
                trendPercentage={kpi.trendPercentage}
              />
            ))}
          </div>

          {/* Mall Properties */}
          <section className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-8 bg-bo-gradient-muted">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
                  {t('mall:portfolio.portfolioProperties', { count: authorizedProperties.length })}
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {authorizedProperties.map((mall) => {
                const identity = getMallIdentity(mall.id);
                return (
                  <MallCard
                    key={mall.id}
                    hover
                    onClick={() => handleMallClick(mall.id)}
                    variant="elevated"
                    padding="md"
                    className="cursor-pointer relative overflow-hidden"
                    style={{
                      borderLeft: `4px solid ${identity.colors.primary}`,
                    }}
                  >
                    {/* Brand gradient accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 opacity-60"
                      style={{
                        background: `linear-gradient(90deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
                      }}
                    />

                    <div className="flex items-start gap-5 mb-4">
                      <div
                        className="flex-shrink-0 w-16 h-16 relative bg-bo-neutral-50 rounded-lg border-2 shadow-bo-sm flex items-center justify-center overflow-hidden"
                        style={{ borderColor: identity.colors.primary }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                          style={{
                            background: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
                          }}
                        >
                          {mall.name[0]}
                        </div>
                      </div>

                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <h3
                            className="text-lg font-semibold tracking-tight"
                            style={{ color: identity.colors.primary }}
                          >
                            {mall.name}
                          </h3>
                          <p className="text-sm text-bo-neutral-600 leading-relaxed">{mall.city}</p>
                        </div>
                        <span
                          className="text-xs font-semibold px-3 py-1.5 rounded-md uppercase tracking-wider"
                          style={{
                            backgroundColor: `${identity.colors.primary}15`,
                            color: identity.colors.primary,
                            border: `1px solid ${identity.colors.primary}40`,
                          }}
                        >
                          {mall.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5 text-sm">
                      <div>
                        <p className="text-bo-neutral-600 text-xs uppercase tracking-wider mb-1">{t('mall:portfolio.currentVisitors')}</p>
                        <p className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
                          {formatVisitors(mall.currentVisitors)}
                        </p>
                      </div>
                      <div>
                        <p className="text-bo-neutral-600 text-xs uppercase tracking-wider mb-1">{t('mall:portfolio.annualVisitors')}</p>
                        <p className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
                          {formatVisitors(mall.annualVisitors)}
                        </p>
                      </div>
                      <div>
                        <p className="text-bo-neutral-600 text-xs uppercase tracking-wider mb-1">{t('mall:portfolio.annualSales')}</p>
                        <p className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
                          {formatCurrency(mall.annualSales)}
                        </p>
                      </div>
                    </div>
                  </MallCard>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}