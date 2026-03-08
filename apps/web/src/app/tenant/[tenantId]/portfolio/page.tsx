/**
 * Tenant Portfolio Overview Page
 *
 * Multi-property dashboard showing all malls for a specific tenant/management company
 * Features:
 * - Tenant-specific routing via /tenant/[tenantId]/portfolio
 * - Management company header with portfolio stats
 * - 4 Network KPI cards (visitors, growth, weather, alerts)
 * - Mall cards grid with status badges
 * - Network map sidebar with property pins
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import useSWR from 'swr';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from '@/lib/i18n/hooks';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallKPICard } from '@/components/mall/ui/MallKPICard';
import { MallCard } from '@/components/mall/ui/MallCard';
import { MallCardHeatmap } from '@/components/mall/ui/MallCardHeatmap';
import { MallNetworkMap, type PropertyLocation } from '@/components/mall/maps/MallNetworkMap';
import { WeatherKPI } from '@/components/mall/WeatherKPI';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMallLogo } from '@/lib/mall/mallLogos';
import { getMallIdentity } from '@/lib/mall/mallIdentity';
import { getMallsByOperator, OPERATORS, getMallBrandColors, getMall } from '@/lib/mall/mallDatabase';
import { getOperatorLogoOrFallback } from '@/lib/mall/operatorLogos';
import { getTriplaParkingSnapshot } from '@/lib/data/triplaTransport';
import { getTriplaCurrentFootfall } from '@/lib/data/triplaFootfall';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Temporary mock data - will be replaced with API calls
const MANAGEMENT_COMPANY = {
  id: 'realidea',
  name: 'Realidea',
  description: 'Multi-property operator',
  propertyCount: 18,
  annualVisitors: 145000000, // Estimated total across 18 properties
  annualSales: 1850000000, // Estimated total
};

// Function to generate translated PORTFOLIO_KPIS
const getPortfolioKPIs = (t: (key: string) => string) => [
  {
    label: t('mall:portfolio.currentVisitors'),
    value: '52.3k',
    delta: `+6.2% ${t('mall:portfolio.vsPlan')}`,
    deltaType: 'positive' as const,
    accent: 'green' as const,
    trendPercentage: 6.2, // Gradient background trigger
  },
  {
    label: t('mall:portfolio.networkGrowth'),
    value: '+8.3%',
    delta: t('mall:portfolio.vsLastYear'),
    deltaType: 'positive' as const,
    accent: 'blue' as const,
    trendPercentage: 8.3, // Gradient background trigger
  },
  {
    label: t('mall:portfolio.activeAlerts'),
    value: '3',
    delta: t('mall:portfolio.requiresAttention'),
    deltaType: 'negative' as const,
    accent: 'red' as const,
    trendPercentage: -2.5, // Gradient background trigger (negative trend)
  },
];

// All properties across all tenants - mock data until DB integration
// Get current footfall data for Tripla
const triplaFootfall = getTriplaCurrentFootfall();

const ALL_PROPERTIES = [
  {
    id: 'sello',
    name: 'Sello',
    city: 'Espoo',
    status: 'live' as const,
    currentVisitors: 0, // No footfall data yet
    annualVisitors: 22600000,
    annualSales: 298000000,
    coordinates: [24.8092, 60.2176] as [number, number], // Espoo, Sello
  },
  {
    id: 'tripla',
    name: 'Mall of Tripla',
    city: 'Helsinki',
    status: 'live' as const,
    currentVisitors: triplaFootfall.currentVisitors, // Real-time footfall data
    annualVisitors: 27300000,
    annualSales: 342000000,
    coordinates: [24.9318, 60.1995] as [number, number], // Helsinki, Tripla
  },
  {
    id: 'kamp-galleria',
    name: 'Kämp Galleria',
    city: 'Helsinki',
    status: 'planned' as const,
    currentVisitors: 0,
    annualVisitors: 3500000,
    annualSales: 85000000,
    coordinates: [24.9450, 60.1674] as [number, number], // Helsinki center
  },
  {
    id: 'karuselli',
    name: 'Karuselli',
    city: 'Kerava',
    status: 'beta' as const,
    currentVisitors: 0,
    annualVisitors: 4200000,
    annualSales: 62000000,
    coordinates: [25.1050, 60.4040] as [number, number], // Kerava
  },
  {
    id: 'plaza',
    name: 'Plaza',
    city: 'Salo',
    status: 'alpha' as const,
    currentVisitors: 0,
    annualVisitors: 3800000,
    annualSales: 54000000,
    coordinates: [23.1261, 60.3833] as [number, number], // Salo
  },
  {
    id: 'arabia',
    name: 'Arabia',
    city: 'Helsinki',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 6500000,
    annualSales: 92000000,
    coordinates: [24.9790, 60.2050] as [number, number], // Helsinki, Arabia
  },
  {
    id: 'columbus',
    name: 'Columbus',
    city: 'Helsinki',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 8200000,
    annualSales: 118000000,
    coordinates: [24.9340, 60.1834] as [number, number], // Helsinki, Kamppi
  },
  {
    id: 'duo',
    name: 'Duo',
    city: 'Tampere',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 7600000,
    annualSales: 105000000,
    coordinates: [23.7610, 61.4978] as [number, number], // Tampere
  },
  {
    id: 'grani',
    name: 'Grani',
    city: 'Kauniainen',
    status: 'beta' as const,
    currentVisitors: 0,
    annualVisitors: 2800000,
    annualSales: 42000000,
    coordinates: [24.7272, 60.2124] as [number, number], // Kauniainen
  },
  {
    id: 'dixi',
    name: 'Dixi',
    city: 'Vantaa',
    status: 'alpha' as const,
    currentVisitors: 0,
    annualVisitors: 5100000,
    annualSales: 68000000,
    coordinates: [25.0343, 60.2935] as [number, number], // Vantaa
  },
  {
    id: 'entresse',
    name: 'Entresse',
    city: 'Espoo',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 11200000,
    annualSales: 148000000,
    coordinates: [24.6597, 60.2046] as [number, number], // Espoo, Tapiola
  },
  {
    id: 'fresko',
    name: 'Fresko',
    city: 'Vantaa',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 5800000,
    annualSales: 78000000,
    coordinates: [25.0410, 60.2775] as [number, number], // Vantaa
  },
  {
    id: 'kale',
    name: 'Kale',
    city: 'Tampere',
    status: 'beta' as const,
    currentVisitors: 0,
    annualVisitors: 3400000,
    annualSales: 48000000,
    coordinates: [23.7804, 61.4981] as [number, number], // Tampere
  },
  {
    id: 'kivis',
    name: 'Kivis',
    city: 'Vantaa',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 5600000,
    annualSales: 72000000,
    coordinates: [25.0390, 60.2862] as [number, number], // Vantaa
  },
  {
    id: 'liila',
    name: 'Liila',
    city: 'Espoo',
    status: 'alpha' as const,
    currentVisitors: 0,
    annualVisitors: 4100000,
    annualSales: 58000000,
    coordinates: [24.7442, 60.2197] as [number, number], // Espoo
  },
  {
    id: 'lansikeskus',
    name: 'Länsikeskus',
    city: 'Espoo',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 6900000,
    annualSales: 96000000,
    coordinates: [24.8018, 60.2230] as [number, number], // Espoo
  },
  {
    id: 'malmin-nova',
    name: 'Malmin Nova',
    city: 'Helsinki',
    status: 'beta' as const,
    currentVisitors: 0,
    annualVisitors: 4600000,
    annualSales: 64000000,
    coordinates: [25.0100, 60.2508] as [number, number], // Helsinki, Malmi
  },
  {
    id: 'martinlaakson-ostari',
    name: 'Martinlaakson ostari',
    city: 'Vantaa',
    status: 'planned' as const,
    currentVisitors: 0,
    annualVisitors: 2900000,
    annualSales: 38000000,
    coordinates: [25.0395, 60.2704] as [number, number], // Vantaa
  },
  // Koy Ideapark Ab properties
  {
    id: 'ideapark',
    name: 'Ideapark Lempäälä',
    city: 'Lempäälä',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 7000000,
    annualSales: 280000000,
    coordinates: [23.7610, 61.3110] as [number, number], // Lempäälä
  },
  // Citycon Oyj properties
  {
    id: 'iso-omena',
    name: 'Iso Omena',
    city: 'Espoo',
    status: 'live' as const,
    currentVisitors: 0,
    annualVisitors: 18000000,
    annualSales: 420000000,
    coordinates: [24.7380, 60.1620] as [number, number], // Espoo, Matinkylä
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return `€${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return num >= 10000000 ? `${(num / 1000000).toFixed(1)}M` : `${(num / 1000000).toFixed(1)}M`;
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

const STATUS_ACCENTS: Record<
  (typeof ALL_PROPERTIES)[number]['status'],
  { ring: string; badgeBg: string; badgeText: string }
> = {
  live: {
    ring: 'border-l-4 border-l-[#25c18a]',
    badgeBg: 'bg-[#d1fae5]',
    badgeText: 'text-[#047857]',
  },
  beta: {
    ring: 'border-l-4 border-l-[#f59f00]',
    badgeBg: 'bg-[#fff4e6]',
    badgeText: 'text-[#b55600]',
  },
  alpha: {
    ring: 'border-l-4 border-l-[#6ea8fe]',
    badgeBg: 'bg-[#e7f1ff]',
    badgeText: 'text-[#1c64f2]',
  },
  planned: {
    ring: 'border-l-4 border-l-[#c4cfdc]',
    badgeBg: 'bg-[#eef2f7]',
    badgeText: 'text-[#475569]',
  },
};

/**
 * Generate dynamic Synexis Signals based on real parking data
 * Analyzes parking occupancy and generates actionable insights
 * IMPORTANT: Only shows signals for malls the tenant has access to
 */
function generateSynexisSignals(authorizedMallIds: string[]): string[] {
  // Synexis signals temporarily disabled (2025-11-27) to avoid any cross-tenant leakage
  return [];
}

/**
 * Heatmap Data Wrapper
 * Fetches latest heatmap data from API and passes to MallCardHeatmap
 */
function MallCardHeatmapWithData({
  mallId,
  colors,
  className,
}: {
  mallId: string;
  colors: { primary: string; secondary: string; accent: string };
  className?: string;
}) {
  const { data, error, isLoading } = useSWR(
    `/api/mall/${mallId}/heatmap/latest`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  );

  return (
    <MallCardHeatmap
      mallId={mallId}
      data={error ? null : data}
      colors={colors}
      className={className}
    />
  );
}

// Map tenant slug to company name
const TENANT_MAP: Record<string, string> = {
  'realidea': 'Realidea',
  'koy-ideapark-oy': 'Koy Ideapark Oy',
  'citycon-oyj': 'Citycon Oyj',
};

export default function TenantPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: sessionLoading } = useSession();
  const { t } = useTranslation(['mall', 'kpi']);

  // Extract tenantId from URL params
  const tenantId = params?.tenantId as string | undefined;
  const tenantName = tenantId ? TENANT_MAP[tenantId] : undefined;

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [dataView, setDataView] = useState<'actual' | 'predicted'>('actual');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [expandedHeatmaps, setExpandedHeatmaps] = useState<Set<string>>(new Set());
  const [showCatchmentZones, setShowCatchmentZones] = useState<boolean>(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push('/mall/login');
    }
  }, [sessionLoading, user, router]);

  // ROUTE GUARD: Validate tenantId slug matches logged-in user's company
  // Prevents users from accessing other tenants' portfolio pages
  useEffect(() => {
    if (!sessionLoading && user && tenantId && tenantName) {
      // Map user's company name to expected tenant slug
      const userTenantSlug = user.companyName.toLowerCase().replace(/\s+/g, '-');

      // If URL tenant slug doesn't match user's tenant, redirect to correct portfolio
      if (tenantId !== userTenantSlug) {
        console.warn(`Route guard: User ${user.companyName} attempted to access ${tenantId} portfolio. Redirecting to ${userTenantSlug}.`);
        router.push(`/tenant/${userTenantSlug}/portfolio`);
      }
    }
  }, [sessionLoading, user, tenantId, tenantName, router]);

  // Portfolio Overview shows all properties for the specific tenant
  // Filter properties based on tenantName from URL
  const authorizedProperties = useMemo(() => {
    if (!user || !tenantName) return [];

    // Realidea portfolio: show all Realidea properties
    // Exclude Ideapark and Iso Omena (not Realidea-owned)
    if (tenantName === 'Realidea') {
      return ALL_PROPERTIES.filter(
        property => property.id !== 'ideapark' && property.id !== 'iso-omena'
      );
    }

    // Koy Ideapark Oy: show only Ideapark
    if (tenantName === 'Koy Ideapark Oy') {
      return ALL_PROPERTIES.filter(property => property.id === 'ideapark');
    }

    // Citycon Oyj: show only Iso Omena
    if (tenantName === 'Citycon Oyj') {
      return ALL_PROPERTIES.filter(property => property.id === 'iso-omena');
    }

    // Default: no properties if tenant not recognized
    return [];
  }, [user, tenantName]);

  // Synexis signals disabled (2025-11-27)
  const synexisSignals: string[] = [];

  // Mapbox access token from environment variable
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting portfolio as ${format}`);
    // TODO: Implement export functionality
  };

  const handleMallClick = (mallId: string) => {
    router.push(`/mall/${mallId}`);
  };

  const toggleHeatmap = (mallId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setExpandedHeatmaps((prev) => {
      const next = new Set(prev);
      if (next.has(mallId)) {
        next.delete(mallId);
      } else {
        next.add(mallId);
      }
      return next;
    });
  };

  const handlePropertyMapClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  // Convert authorized properties to PropertyLocation format for map with brand colors
  const propertyLocations: PropertyLocation[] = authorizedProperties.map((prop) => {
    const brandColors = getMallBrandColors(prop.id);
    return {
      id: prop.id,
      name: prop.name,
      city: prop.city,
      status: prop.status,
      coordinates: prop.coordinates,
      brandColor: brandColors.primary, // Use mall's brand primary color for map marker
    };
  });

  // Calculate tenant-specific totals
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

  // Get operator logo for the header (after tenantStats is defined)
  const operatorLogo = getOperatorLogoOrFallback(tenantStats.companyName);

  return (
    <div className="min-h-screen bg-bo-beige-100">
      {/* Left Navigation */}
      <MallLeftNav
        managementCompanyId={tenantId || ''}
        onNavigate={(itemId) => console.log(`Navigate to: ${itemId}`)}
      />

      {/* Top Bar */}
      <MallTopBar
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        dataView={dataView}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        onDataViewChange={setDataView}
        onExport={handleExport}
        pageTitle="Portfolio-yleiskatsaus"
      />

      {/* Main Content */}
      <main className="ml-[80px] mt-[80px] p-8">
        {/* Guard: render nothing until session is confirmed — prevents flash of wrong tenant data */}
        {(sessionLoading || !user) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-bo-neutral-400 text-sm">Loading...</div>
          </div>
        ) : (
        <div className="max-w-[1600px] mx-auto flex gap-8">
          <div className="flex-1 space-y-8">
            {/* Management Company Header */}
            <div className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-8 flex flex-col gap-6 bg-bo-gradient-muted">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Company Logo */}
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
                  {/* Company Info */}
                  <div>
                    <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
                      {tenantStats.companyName}
                    </h1>
                    <p className="text-sm text-bo-neutral-600 leading-relaxed">
                      {tenantStats.propertyCount > 1 ? t('mall:portfolio.multiPropertyOperator') : t('mall:portfolio.propertyOperator')} • {t('mall:portfolio.shoppingCenters', { count: tenantStats.propertyCount })}
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

            {/* KPI Cards Grid - 3 KPIs per approved design (Weather removed from portfolio level) */}
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
            <section className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-8 bg-bo-gradient-muted bg-bo-corner-glow">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
                    {t('mall:portfolio.portfolioProperties', { count: authorizedProperties.length })}
                  </h2>
                </div>
                <Button variant="ghost" className="text-bo-primary-600 hover:text-bo-primary-700 hover:bg-bo-primary-50">
                  {t('mall:portfolio.viewAll')}
                </Button>
              </div>

              <div className="space-y-5">
                {authorizedProperties.map((mall) => {
                  const accent = STATUS_ACCENTS[mall.status];
                  const logoPath = getMallLogo(mall.id);
                  const identity = getMallIdentity(mall.id);
                  return (
                    <MallCard
                      key={mall.id}
                      hover
                      onClick={() => handleMallClick(mall.id)}
                      variant="elevated"
                      padding="md"
                      className={cn(
                        'cursor-pointer',
                        'relative overflow-hidden'
                      )}
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
                        {/* Mall Logo */}
                        <div
                          className="flex-shrink-0 w-16 h-16 relative bg-bo-neutral-50 rounded-lg border-2 shadow-bo-sm flex items-center justify-center overflow-hidden"
                          style={{ borderColor: identity.colors.primary }}
                        >
                          {logoPath ? (
                            <Image
                              src={logoPath}
                              alt={`${mall.name} logo`}
                              fill
                              sizes="64px"
                              className="object-contain p-2"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                              style={{
                                background: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
                              }}
                            >
                              {mall.name[0]}
                            </div>
                          )}
                        </div>

                        {/* Mall Info */}
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

                      <div className="grid grid-cols-3 gap-5 text-sm mb-5">
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

                      {/* Heatmap Preview - Expandable/Collapsible */}
                      <div className="pt-5 border-t border-bo-neutral-200">
                        {expandedHeatmaps.has(mall.id) ? (
                          <div className="space-y-2">
                            <MallCardHeatmapWithData
                              mallId={mall.id}
                              colors={identity.colors}
                              className="w-full"
                            />
                            <button
                              onClick={(e) => toggleHeatmap(mall.id, e)}
                              className="w-full text-xs font-medium flex items-center justify-center gap-1.5 py-2 transition-all duration-200 ease-bo-out hover:opacity-70"
                              style={{ color: identity.colors.primary }}
                            >
                              {t('mall:portfolio.hideHeatmap')}
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => toggleHeatmap(mall.id, e)}
                            className="w-full text-xs font-medium flex items-center justify-center gap-1.5 py-2 transition-all duration-200 ease-bo-out hover:opacity-70"
                            style={{ color: identity.colors.primary }}
                          >
                            {t('mall:portfolio.viewHeatmap')}
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </MallCard>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right side panel */}
          <aside className="w-full max-w-[480px] space-y-6 sticky top-24 h-fit">
            <div className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
                  {t('mall:portfolio.finlandPortfolioMap')}
                </h3>
                <label className="flex items-center gap-2 text-xs text-bo-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-bo-neutral-300 cursor-pointer"
                    checked={showCatchmentZones}
                    onChange={(e) => setShowCatchmentZones(e.target.checked)}
                  />
                  {t('mall:portfolio.showCatchmentZones', 'Show catchment zones')}
                </label>
              </div>
              <div className="w-full h-[500px] rounded-lg overflow-hidden border border-bo-neutral-200">
                {mapboxToken ? (
                  <MallNetworkMap
                    properties={propertyLocations}
                    onPropertyClick={handlePropertyMapClick}
                    selectedPropertyId={selectedPropertyId}
                    showCatchmentZones={showCatchmentZones}
                    height="500px"
                    accessToken={mapboxToken}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-bo-neutral-500 text-sm bg-bo-neutral-100">
                    Map requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                  </div>
                )}
              </div>
            </div>

            <div className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-6 space-y-4">
              <h4 className="text-base font-semibold text-bo-neutral-950 tracking-tight">{t('mall:portfolio.mallStatus')}</h4>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-bo-success shadow-bo-sm" />
                  <div>
                    <p className="font-medium text-bo-neutral-900 tracking-wide">{t('mall:portfolio.statusLive')}</p>
                    <p className="text-xs text-bo-neutral-600">
                      {propertyLocations.filter((p) => p.status === 'live').length} {t('mall:portfolio.malls')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-bo-info shadow-bo-sm" />
                  <div>
                    <p className="font-medium text-bo-neutral-900 tracking-wide">{t('mall:portfolio.statusAlpha')}</p>
                    <p className="text-xs text-bo-neutral-600">
                      {propertyLocations.filter((p) => p.status === 'alpha').length} {t('mall:portfolio.malls')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-bo-warning shadow-bo-sm" />
                  <div>
                    <p className="font-medium text-bo-neutral-900 tracking-wide">{t('mall:portfolio.statusBeta')}</p>
                    <p className="text-xs text-bo-neutral-600">
                      {propertyLocations.filter((p) => p.status === 'beta').length} {t('mall:portfolio.malls')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-bo-neutral-300 shadow-bo-sm" />
                  <div>
                    <p className="font-medium text-bo-neutral-900 tracking-wide">{t('mall:portfolio.statusPlanned')}</p>
                    <p className="text-xs text-bo-neutral-600">
                      {propertyLocations.filter((p) => p.status === 'planned').length} {t('mall:portfolio.malls')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bo-glass rounded-xl border border-bo-neutral-200/30 shadow-bo-glass p-6">
              <h4 className="text-base font-semibold text-bo-neutral-950 mb-4 tracking-tight">{t('mall:portfolio.networkMetrics')}</h4>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between items-baseline">
                  <dt className="text-bo-neutral-600">{t('mall:portfolio.totalProperties')}</dt>
                  <dd className="font-semibold text-bo-neutral-950">{authorizedProperties.length}</dd>
                </div>
                <div className="flex justify-between items-baseline">
                  <dt className="text-bo-neutral-600">{t('mall:portfolio.avgPerformance')}</dt>
                  <dd className="font-semibold text-bo-success-dark">+6.2% vs plan</dd>
                </div>
                <div className="flex justify-between items-baseline">
                  <dt className="text-bo-neutral-600">{t('mall:portfolio.mlAccuracy')}</dt>
                  <dd className="font-semibold text-bo-info-dark">12.94% MAPE</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
        )}
      </main>
    </div>
  );
}
