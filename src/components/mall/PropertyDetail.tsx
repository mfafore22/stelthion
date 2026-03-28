/**
 * Property Detail Component
 * Main content area for individual mall deep dive
 */

'use client';

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
import type { HSLAccessibility, NysseAccessibility, VRConnections, CatchmentDemographics, ParkingData, LiveDepartures } from '@/lib/types/transport';
import type { EventsData } from '@/lib/types/events';
import { getCurrentFootfall } from '@/lib/data/footfall';
import { useCounterFootfall } from '@/hooks/mall/useCounterFootfall';
import { useTranslation } from 'react-i18next';
import { VideoAnalysis } from './video-analysis/VideoAnalysis';

// Baseline deltas — static until real sensor comparison is available.
const BASE_DELTAS = {
  dwellDelta: 12,
  conversionDelta: 5.2,
};

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
      alerts: [] as any[],
    };
  }, []);

  const [basePerformance, setBasePerformance] = useState(buildSnapshot);

  useEffect(() => {
    const id = setInterval(() => setBasePerformance(buildSnapshot()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [buildSnapshot]);

  // When real counter data is available, override simulated values
  const performance = React.useMemo(() => {
    if (!hasRealData) return basePerformance;
    const yoyDelta = currentHourPrevYear
      ? ((currentHourVisitors - currentHourPrevYear) / currentHourPrevYear) * 100
      : 0;
    return {
      ...basePerformance,
      currentVisitors: currentHourVisitors,
      deltaVsPlan: Math.round(yoyDelta * 10) / 10,
      dwellTime: null as number | null,
      dwellDelta: 0,
      conversionRate: null as number | null,
      conversionDelta: 0,
    };
  }, [hasRealData, currentHourVisitors, currentHourPrevYear, basePerformance]);

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
    parkingData.levels.forEach((level: any) => {
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
      if (mallId !== 'ideapark') return;

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
    if (mallId !== 'ideapark') return;

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

  const topCategory = categories[0];
  const findCategory = (name: string) => categories.find(c => c.name === name);

  return (
    <div className="space-y-8">
      {/* Brand Identity Header */}
      <div
        className="rounded-xl p-8 relative overflow-hidden shadow-bo-md"
        style={{
          background: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
        }}
      >
        <div className="relative z-10 flex items-center justify-between w-full">
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
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: identity.primaryTextColor }}
            >
              {mallName}
            </h1>
            <span
              className="text-sm px-4 py-1.5 rounded-md font-medium tracking-wide"
              style={{
                backgroundColor: 'rgba(255,255,255,0.35)',
                color: identity.primaryTextColor,
              }}
            >
              {mallCity}
            </span>
          </div>
          {/* Customer logo — right end of the identity banner */}
          {identity.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={identity.logo}
              alt={identity.name}
              style={{ height: '52px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
            />
          )}
        </div>
      </div>

      {/* Property Header with Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MallKPICard
          label={t('detail.totalShops')}
          value={totalShops.toString()}
          delta={`${t('detail.infoUpdated')} ${dataUpdated ? new Date(dataUpdated).toLocaleDateString() : ''}`}
          accentColor={identity.colors.primary}
        />
        <MallKPICard
          label={t('detail.topCategory')}
          value={topCategory ? t(`tenants.categoryNames.${topCategory.name}`, { defaultValue: topCategory.name }) : 'N/A'}
          delta={topCategory ? `${topCategory.shopCount} ${t('detail.shops')} (${topCategory.percentage.toFixed(1)}%)` : ''}
          accentColor={identity.colors.secondary}
        />
        <MallKPICard
          label={t('detail.foodBeverage')}
          value={`${findCategory('Food & Beverage')?.percentage.toFixed(1) || 0}%`}
          delta={`${findCategory('Food & Beverage')?.shopCount || 0} ${t('detail.shops')}`}
          accentColor={identity.colors.accent}
        />
        <MallKPICard
          label={t('detail.homeLiving')}
          value={`${findCategory('Home & Living')?.percentage.toFixed(1) || 0}%`}
          delta={`${findCategory('Home & Living')?.shopCount || 0} ${t('detail.shops')}`}
          accentColor={identity.colors.primary}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="performance">{t('tabs.performance')}</TabsTrigger>
          <TabsTrigger value="location">{t('tabs.location')}</TabsTrigger>
          <TabsTrigger value="tenants">{t('tabs.tenants')}</TabsTrigger>
          <TabsTrigger value="events">{t('tabs.events')}</TabsTrigger>
          <TabsTrigger value="weather">{t('tabs.weather')}</TabsTrigger>
          {/* Campaigns tab hidden — feature deactivated */}
          <TabsTrigger value="analysis">{t('tabs.analysis', 'Video Analysis')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            {/* Tenant Mix Chart */}
            <TenantMixChart
              retailerTypePercentages={Object.fromEntries(categories.map(c => [c.name, c.percentage]))}
              totalShops={totalShops}
            />

            {/* Top Categories Table */}
            <TopCategoriesTable categories={categories.map(c => ({ category: c.name, count: c.shopCount, percentage: c.percentage }))} limit={10} />
          </div>

          {/* Additional Info Card */}
          <Card className="p-8 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass rounded-xl bg-bo-gradient-muted">
            <div className="grid grid-cols-3 gap-8 text-sm">
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

        <TabsContent value="performance" className="space-y-8">
          {/* Hero Section */}
          <div className="grid grid-cols-3 gap-8">
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
              />
            </div>

            {/* Right Columns: Charts & Insights */}
            <div className="col-span-2 space-y-4">
              <FootfallChart mallId={mallId} showPredicted={showPredicted} />
              <WeatherNextPanel mallId={mallId} />
              <EventsPanel mallId={mallId} />
              {/* CampaignCard hidden — campaigns feature deactivated */}
            </div>
          </div>

          {/* Tenant Performance */}
          <TenantPerformanceTable mallId={mallId} />

          {/* Bottom Row: Alerts & Scenarios */}
          <div className="grid grid-cols-2 gap-8">
            <AlertsStream alerts={alerts} />
            {/* ScenarioShortcuts hidden — scenarios feature deactivated */}
          </div>
        </TabsContent>

        <TabsContent value="location" className="space-y-8">
          {locationDataLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-bo-neutral-500">{t('detail.locationLoading')}</p>
            </div>
          ) : (
            <>
              {/* Transport Accessibility & Parking */}
              <div className="grid grid-cols-2 gap-6">
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
                  mallName={mallName || 'Ideapark Lempäälä'}
                />
              )}

              {/* Fallback for malls without location data */}
              {!transportData && !demographicsData && !parkingData && (
                <Card className="p-8 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass rounded-xl">
                  <p className="text-bo-neutral-600 text-center">{t('detail.locationNotAvailable')}</p>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="tenants" className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <TenantMixChart
              retailerTypePercentages={Object.fromEntries(categories.map(c => [c.name, c.percentage]))}
              totalShops={totalShops}
            />
            <TopCategoriesTable categories={categories.map(c => ({ category: c.name, count: c.shopCount, percentage: c.percentage }))} limit={15} />
          </div>
          <TenantPerformanceTable mallId={mallId} expanded />
        </TabsContent>

        <TabsContent value="events" className="space-y-8">
          {eventsData ? (
            <EventsCalendar eventsData={eventsData} />
          ) : (
            <Card className="p-12 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
              <p className="text-bo-neutral-600 text-center">{t('detail.eventsNotAvailable')}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weather">
          <WeatherNextPanel mallId={mallId} expanded />
        </TabsContent>

        <TabsContent value="events">
          <EventsPanel mallId={mallId} expanded />
        </TabsContent>

        {/* Campaigns tab content hidden — feature deactivated */}

        <TabsContent value="analysis">
          <VideoAnalysis mallId={mallId} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
