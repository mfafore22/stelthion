/**
 * Property Detail Component
 * Main content area for individual mall deep dive
 */

'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyKPIs } from './PropertyKPIs';
import { FootfallChart } from './FootfallChart';

import { WeatherNextPanel } from './WeatherNextPanel';
import { EventsPanel } from './EventsPanel';
// import { CampaignCard } from './CampaignCard'; // Campaigns feature deactivated
import { TenantPerformanceTable } from './TenantPerformanceTable';
import { AlertsStream } from './AlertsStream';
// import { ScenarioShortcuts } from './ScenarioShortcuts'; // Scenarios feature deactivated
import { TenantMixChart } from './TenantMixChart';
import { TopCategoriesTable } from './TopCategoriesTable';
import { TransportAccessibilityKPI } from './TransportAccessibilityKPI';
import { ParkingStatusKPI } from './ParkingStatusKPI';
import { DemographicsKPI } from './DemographicsKPI';
import { CatchmentMap } from './CatchmentMap';
import { EventsCalendar } from './EventsCalendar';
import { MallKPICard } from './ui/MallKPICard';
import { useMallDetail } from '@/hooks/mall/useMallData';
import { useMallIdentity } from '@/hooks/mall/useMallIdentity';
import { canonicalizeMallId } from '@/lib/mall/ids';
import type { HSLAccessibility, NysseAccessibility, VRConnections, CatchmentDemographics, ParkingData, LiveDepartures } from '@/lib/types/transport';
import type { EventsData } from '@/lib/types/events';
import { getCurrentFootfall } from '@/lib/data/footfall';
import { useCounterFootfall } from '@/hooks/mall/useCounterFootfall';
import { useTranslation } from 'react-i18next';
import { VideoAnalysis } from './video-analysis/VideoAnalysis';
import { MallIdentityBanner } from '@/components/mall/visuals/MallIdentityBanner';
import { getMallLogo } from '@/lib/mall/mallLogos';
import { SelloTenantLocations } from './SelloTenantLocations';

// Baseline deltas — static until real sensor comparison is available.
const BASE_DELTAS = {
  dwellDelta: 12,
  conversionDelta: 5.2,
};

type PropertyAlert = { time: string; level: 'warning' | 'info'; message: string };

const LOCATION_DATA_MALLS = new Set(['ideapark-lempaala', 'realidea-sello', 'realidea-tripla']);

function hasLocationData(mallId: string): boolean {
  const canonical = canonicalizeMallId(mallId);
  return canonical ? LOCATION_DATA_MALLS.has(canonical) : false;
}

interface PropertyDetailProps {
  mallId: string;
  showPredicted?: boolean;
}

export function PropertyDetail({ mallId: mallIdProp, showPredicted = false }: PropertyDetailProps) {
  const { t } = useTranslation('mall');
  const [activeTab, setActiveTab] = useState('overview');
  const { data: mallData, loading, error } = useMallDetail(mallIdProp);
  // In C2, mallIdProp is already the correct mallId slug from the session.
  const mallId = mallIdProp;
  const identity = useMallIdentity(mallId);

  // Real counter data (when available)
  const {
    hasRealData,
    currentHourVisitors,
    currentHourPrevYear,
    estimateForHour,
  } = useCounterFootfall(mallId);

  // Live footfall snapshot — refreshes every 5 minutes so KPIs track the clock
  const buildSnapshot = React.useCallback(() => {
    const f = getCurrentFootfall();
    return {
      currentVisitors: f.currentVisitors,
      deltaVsPlan: f.vsPlanned,
      weatherImpact: f.weatherBoost,
      dwellTime: f.dwellTimeMinutes,
      conversionRate: f.conversionRate,
      ...BASE_DELTAS,
      alerts: [] as PropertyAlert[],
    };
  }, []);

  const [basePerformance, setBasePerformance] = useState(buildSnapshot);

  useEffect(() => {
    const id = setInterval(() => setBasePerformance(buildSnapshot()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [buildSnapshot]);

  // Build visitor KPI from real data → profile estimate → null (no hardcoded fallback)
  const performance = React.useMemo(() => {
    const now = new Date();
    const base = {
      ...basePerformance,
      dwellTime: null as number | null,
      dwellDelta: 0,
      conversionRate: null as number | null,
      conversionDelta: 0,
      isEstimated: false,
    };

    // Priority 1: exact counter data for current hour today
    if (hasRealData && currentHourVisitors > 0) {
      const yoyDelta = currentHourPrevYear
        ? ((currentHourVisitors - currentHourPrevYear) / currentHourPrevYear) * 100
        : null;
      return {
        ...base,
        currentVisitors: currentHourVisitors as number | null,
        deltaVsPlan: yoyDelta !== null ? Math.round(yoyDelta * 10) / 10 : null as number | null,
        isEstimated: false,
      };
    }

    // Priority 2: profile estimate for this weekday + hour
    const est = estimateForHour(now.getDay(), now.getHours());
    if (est.visitors > 0) {
      const yoyDelta = est.prevYear
        ? ((est.visitors - est.prevYear) / est.prevYear) * 100
        : null;
      return {
        ...base,
        currentVisitors: est.visitors as number | null,
        deltaVsPlan: yoyDelta !== null ? Math.round(yoyDelta * 10) / 10 : null as number | null,
        isEstimated: true,
      };
    }

    // Priority 3: no data — show null (no fake numbers)
    return { ...base, currentVisitors: null as number | null, deltaVsPlan: null as number | null, isEstimated: false };
  }, [hasRealData, currentHourVisitors, currentHourPrevYear, estimateForHour, basePerformance]);

  // Transport, demographics, and parking data
  const [transportData, setTransportData] = useState<{ hsl?: HSLAccessibility; nysse?: NysseAccessibility; vr?: VRConnections } | null>(null);
  const [demographicsData, setDemographicsData] = useState<CatchmentDemographics | null>(null);
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [liveDepartures, setLiveDepartures] = useState<LiveDepartures | null>(null);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [locationDataLoading, setLocationDataLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  // Generate time-aware alerts from real parking data
  const alerts = React.useMemo(() => {
    if (!parkingData) return [];

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const generatedAlerts: Array<{time: string, level: 'warning' | 'info', message: string}> = [];

    // Check if parking is closed (mall closed hours)
    const isClosed = (dayOfWeek === 0 && (hour < 10 || hour >= 20)) ||
                     (dayOfWeek !== 0 && (hour < 9 || hour >= 21));

    if (isClosed) {
      generatedAlerts.push({
        time: timeStr,
        level: 'info' as const,
        message: t('alertsStream.parkingClosed')
      });
      return generatedAlerts;
    }

    // Check each parking level for high utilization during operating hours
    parkingData.levels.forEach((level) => {
      const utilization = (level.currentOccupancy / level.capacity) * 100;
      if (utilization >= 90) {
        generatedAlerts.push({
          time: timeStr,
          level: 'warning' as const,
          message: t('alertsStream.parkingLevel', { id: level.id, utilization: utilization.toFixed(0) })
        });
      }
    });

    // Add info message if all clear
    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        time: timeStr,
        level: 'info' as const,
        message: t('alertsStream.parkingNormal')
      });
    }

    return generatedAlerts;
  }, [parkingData, t]);

  // Fetch transport, demographics, and parking data
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!hasLocationData(mallId)) return;

      setLocationDataLoading(true);
      try {
        const [transportRes, demographicsRes, parkingRes] = await Promise.all([
          fetch(`/api/transport/${mallId}`),
          fetch(`/api/demographics/${mallId}`),
          fetch(`/api/parking/${mallId}`)
        ]);

        if (transportRes.ok) {
          const data = await transportRes.json();
          setTransportData({
            hsl: data.hsl_accessibility,
            nysse: data.nysse_accessibility,
            vr: data.vr_connections
          });
        }

        if (demographicsRes.ok) {
          const data = await demographicsRes.json();
          setDemographicsData(data.demographics);
        }

        if (parkingRes.ok) {
          const data = await parkingRes.json();
          setParkingData(data.parking);
        }
      } catch (err) {
        console.error('Error fetching location data:', err);
      } finally {
        setLocationDataLoading(false);
      }
    };

    fetchLocationData();
  }, [mallId]);

  // Fetch live departures (updates every 30 seconds)
  useEffect(() => {
    if (!hasLocationData(mallId)) return;

    const fetchDepartures = async () => {
      try {
        const response = await fetch(`/api/departures/${mallId}`);
        if (response.ok) {
          const data = await response.json();
          setLiveDepartures(data);
        }
      } catch (error) {
        console.error('Error fetching live departures:', error);
      }
    };

    // Initial fetch
    fetchDepartures();

    // Update every 30 seconds
    const interval = setInterval(fetchDepartures, 30000);

    return () => clearInterval(interval);
  }, [mallId]);

  // Fetch events data from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/events/${mallId}`);
        if (response.ok) {
          const data = await response.json();
          setEventsData(data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [mallId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-bo-neutral-500">{t('detail.loading')}</p>
      </div>
    );
  }

  if (error || !mallData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-bo-error-dark">
          {t('detail.loadFailed')} {error || t('detail.notFound')}
        </p>
      </div>
    );
  }

  // C2 field normalization: map API response shape to C1-compatible aliases
  const categories = (mallData.summary?.top_categories || []).map(c => ({
    name: c.category,
    shopCount: c.count,
    percentage: c.percentage,
  }));
  const mallName = mallData.summary?.mall_name || '';
  const mallCity = mallData.summary?.city || '';
  const totalShops = mallData.summary?.total_shops || 0;
  const dataUpdated = mallData.summary?.collection_date || '';
  const mallLogo = getMallLogo(mallId);

  const topCategory = categories[0];
  const findCategory = (name: string) => categories.find(c => c.name === name);

  return (
    <div className="space-y-6">
      <section className="bo-surface bo-surface-hover rounded-2xl border-2 border-bo-primary-200/60 p-5 sm:p-6">
        <MallIdentityBanner
          title={mallName}
          primary={identity.colors.primary}
          secondary={identity.colors.secondary}
          accent={identity.colors.accent}
        />
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-bo-neutral-200 bg-white shadow-bo-sm">
              {mallLogo ? (
                <Image src={mallLogo} alt={mallName} width={40} height={40} className="h-10 w-10 object-contain" />
              ) : (
                <div className="text-lg font-semibold text-bo-primary-700">{mallName.slice(0, 2)}</div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-bo-neutral-950">{mallName}</h1>
              <p className="mt-1 text-sm text-bo-neutral-600">{mallCity}</p>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-bo-neutral-600">
                {t('detail.propertyBody')}
              </p>
            </div>
          </div>
          <span className="rounded-md border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: `${identity.colors.primary}40`, color: identity.colors.primary, backgroundColor: `${identity.colors.primary}12` }}>{mallCity}</span>
        </div>
      </section>

      {/* Property Header with Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MallKPICard
          label={t('detail.totalShops')}
          value={totalShops.toString()}
          delta={`${t('detail.infoUpdated')} ${dataUpdated ? new Date(dataUpdated).toLocaleDateString() : ''}`}
          surfaceAccent={identity.colors}
          trendPercentage={0}
        />
        <MallKPICard
          label={t('detail.topCategory')}
          value={topCategory ? t(`tenants.categoryNames.${topCategory.name}`, { defaultValue: topCategory.name }) : 'N/A'}
          delta={topCategory ? `${topCategory.shopCount} ${t('detail.shops')} (${topCategory.percentage.toFixed(1)}%)` : ''}
          surfaceAccent={{ primary: identity.colors.secondary, secondary: identity.colors.accent }}
          trendPercentage={topCategory?.percentage ?? 0}
        />
        <MallKPICard
          label={t('detail.foodBeverage')}
          value={`${findCategory('Food & Beverage')?.percentage.toFixed(1) || 0}%`}
          delta={`${findCategory('Food & Beverage')?.shopCount || 0} ${t('detail.shops')}`}
          surfaceAccent={{ primary: identity.colors.accent, secondary: identity.colors.secondary }}
          trendPercentage={findCategory('Food & Beverage')?.percentage ?? 0}
        />
        <MallKPICard
          label={t('detail.homeLiving')}
          value={`${findCategory('Home & Living')?.percentage.toFixed(1) || 0}%`}
          delta={`${findCategory('Home & Living')?.shopCount || 0} ${t('detail.shops')}`}
          surfaceAccent={{ primary: identity.colors.primary, secondary: identity.colors.secondary }}
          trendPercentage={findCategory('Home & Living')?.percentage ?? 0}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="min-w-max gap-1 border-2 border-bo-neutral-200/70 bg-white/75 p-1 backdrop-blur-xl">
            <TabsTrigger className="px-4" value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger className="px-4" value="performance">{t('tabs.performance')}</TabsTrigger>
            <TabsTrigger className="px-4" value="location">{t('tabs.location')}</TabsTrigger>
            <TabsTrigger className="px-4" value="tenants">{t('tabs.tenants')}</TabsTrigger>
            <TabsTrigger className="px-4" value="events">{t('tabs.events')}</TabsTrigger>
            <TabsTrigger className="px-4" value="weather">{t('tabs.weather')}</TabsTrigger>
            {/* Campaigns tab hidden — feature deactivated */}
            <TabsTrigger className="px-4" value="analysis">{t('tabs.analysis', 'Video Analysis')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Tenant Mix Chart */}
            <TenantMixChart
              retailerTypePercentages={Object.fromEntries(categories.map(c => [c.name, c.percentage]))}
              totalShops={totalShops}
            />

            {/* Top Categories Table */}
            <TopCategoriesTable categories={categories.map(c => ({ category: c.name, count: c.shopCount, percentage: c.percentage }))} limit={10} />
          </div>

          {/* Additional Info Card */}
          <Card className="bo-surface-subtle bo-surface-hover relative overflow-hidden rounded-xl border-2 border-bo-neutral-200/60 p-6 shadow-bo-glass">
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: `linear-gradient(90deg, ${identity.colors.primary}, ${identity.colors.secondary})` }}
            />
            <div className="grid gap-5 text-sm md:grid-cols-3">
              <div>
                <p className="text-bo-neutral-600 mb-2 uppercase tracking-wider text-xs font-medium">{t('detail.infoLocation')}</p>
                <p className="text-bo-neutral-950 font-semibold tracking-tight">{mallCity}</p>
              </div>
              <div>
                <p className="text-bo-neutral-600 mb-2 uppercase tracking-wider text-xs font-medium">{t('detail.infoDataSource')}</p>
                <p className="text-bo-neutral-950 font-semibold tracking-tight">Stelthion</p>
              </div>
              <div>
                <p className="text-bo-neutral-600 mb-2 uppercase tracking-wider text-xs font-medium">{t('detail.infoUpdated')}</p>
                <p className="text-bo-neutral-950 font-semibold tracking-tight">
                  {dataUpdated ? new Date(dataUpdated).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Hero Section */}
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Left Column: KPIs */}
            <div className="space-y-5">
              <PropertyKPIs
                currentVisitors={performance.currentVisitors}
                deltaVsPlan={performance.deltaVsPlan}
                weatherImpact={performance.weatherImpact}
                dwellTime={performance.dwellTime}
                dwellDelta={performance.dwellDelta}
                conversionRate={performance.conversionRate}
                conversionDelta={performance.conversionDelta}
                alerts={alerts}
                hasRealData={hasRealData}
                isEstimated={performance.isEstimated}
              />
            </div>

            {/* Right Columns: Charts & Insights */}
            <div className="space-y-4 xl:col-span-2">
              <FootfallChart mallId={mallId} showPredicted={showPredicted} />
              <WeatherNextPanel mallId={mallId} />
              <EventsPanel mallId={mallId} />
              {/* CampaignCard hidden — campaigns feature deactivated */}
            </div>
          </div>

          {/* Tenant Performance */}
          <TenantPerformanceTable mallId={mallId} />

          {/* Bottom Row: Alerts & Scenarios */}
          <div className="grid gap-6 xl:grid-cols-2">
            <AlertsStream alerts={alerts} />
            {/* ScenarioShortcuts hidden — scenarios feature deactivated */}
          </div>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          {locationDataLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-bo-neutral-500">{t('detail.locationLoading')}</p>
            </div>
          ) : (
            <>
              {/* Transport Accessibility & Parking */}
              <div className="grid gap-6 xl:grid-cols-2">
                {transportData && (
                  <TransportAccessibilityKPI
                    hslData={transportData.hsl}
                    nysseData={transportData.nysse}
                    vrData={transportData.vr}
                    liveDepartures={liveDepartures || undefined}
                  />
                )}
                {parkingData && (
                  <ParkingStatusKPI parkingData={parkingData} />
                )}
              </div>

              {/* Demographics */}
              {demographicsData && (
                <DemographicsKPI demographics={demographicsData} />
              )}

              {/* Catchment map */}
              {demographicsData && (
                <CatchmentMap
                  demographics={demographicsData}
                  selectedZone={selectedZone}
                  onZoneSelect={setSelectedZone}
                  mallId={mallId}
                  mallName={mallName || mallId}
                />
              )}

              {/* Fallback for malls without location data */}
              {!transportData && !demographicsData && !parkingData && (
                <Card className="bo-surface-subtle bo-surface-hover rounded-xl border-2 border-bo-neutral-200/60 p-8 shadow-bo-glass">
                  <p className="text-bo-neutral-600 text-center">{t('detail.locationNotAvailable')}</p>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <TenantMixChart
              retailerTypePercentages={Object.fromEntries(categories.map(c => [c.name, c.percentage]))}
              totalShops={totalShops}
            />
            <TopCategoriesTable categories={categories.map(c => ({ category: c.name, count: c.shopCount, percentage: c.percentage }))} limit={15} />
          </div>
          <SelloTenantLocations mallId={mallId} />
          <TenantPerformanceTable mallId={mallId} expanded />
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          {eventsData ? (
            <EventsCalendar eventsData={eventsData} />
          ) : (
            <Card className="bo-surface-subtle bo-surface-hover rounded-xl border-2 border-bo-neutral-200/60 p-12 shadow-bo-glass">
              <p className="text-bo-neutral-600 text-center">{t('detail.eventsNotAvailable')}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <WeatherNextPanel mallId={mallId} expanded />
        </TabsContent>

        {/* Campaigns tab content hidden — feature deactivated */}

        <TabsContent value="analysis" className="space-y-6">
          <VideoAnalysis mallId={mallId} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
