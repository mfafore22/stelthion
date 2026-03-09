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
import { FootfallAnalysis } from './FootfallAnalysis';
import { WeatherNextPanel } from './WeatherNextPanel';
import { EventsPanel } from './EventsPanel';
import { CampaignCard } from './CampaignCard';
import { TenantPerformanceTable } from './TenantPerformanceTable';
import { AlertsStream } from './AlertsStream';
import { ScenarioShortcuts } from './ScenarioShortcuts';
import { TenantMixChart } from './TenantMixChart';
import { TopCategoriesTable } from './TopCategoriesTable';
import { TransportAccessibilityKPI } from './TransportAccessibilityKPI';
import { ParkingStatusKPI } from './ParkingStatusKPI';
import { EventsCalendar } from './EventsCalendar';
import { MallKPICard } from './ui/MallKPICard';
import { useMallDetail } from '@/hooks/mall/useMallData';
import { useMallIdentity } from '@/hooks/mall/useMallIdentity';
import type { HSLAccessibility, NysseAccessibility, VRConnections, CatchmentDemographics, ParkingData, LiveDepartures } from '@/lib/types/transport';
import type { EventsData } from '@/lib/types/events';
import { getTriplaCurrentFootfall } from '@/lib/data/triplaFootfall';
import { useTranslation } from 'react-i18next';

/**
 * Generate realistic time-aware footfall for a mall
 * Based on operating hours and typical shopping patterns
 */
function generateRealisticFootfall(mallId: string, date: Date = new Date()): number {
  const hour = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Mall operating hours: 9:00-21:00 Mon-Sat, 10:00-20:00 Sun
  const isClosed = (dayOfWeek === 0 && (hour < 10 || hour >= 20)) ||
                   (dayOfWeek !== 0 && (hour < 9 || hour >= 21));

  // Peak capacity varies by mall size
  const peakCapacity: Record<string, number> = {
    tripla: 45000,    // Large flagship mall
    sello: 48000,     // Large regional mall
    itis: 35000,
    jumbo: 32000,
    ideapark: 12000,  // Suburban mega-mall, 7.5M annual (lower density format)
    // Default for other malls
  };

  const basePeak = peakCapacity[mallId] || 30000;

  // If closed, only security/cleaning staff (very minimal)
  if (isClosed) {
    return Math.floor(Math.random() * 30 + 10); // 10-40 people
  }

  // Hourly traffic patterns (percentage of peak capacity)
  const hourlyPatterns: Record<number, number> = {
    9: 0.15,   // Opening - slow start
    10: 0.22,  // Building up
    11: 0.45,  // Late morning rush
    12: 0.68,  // Lunch peak
    13: 0.72,  // Lunch continuation
    14: 0.52,  // Post-lunch dip
    15: 0.58,  // Afternoon moderate
    16: 0.75,  // After work/school starts
    17: 0.92,  // Evening peak begins
    18: 1.00,  // Peak hour
    19: 0.85,  // Still busy
    20: 0.42,  // Winding down
    21: 0.18,  // Closing (if open)
  };

  const baseUtilization = hourlyPatterns[hour] || 0.3;

  // Weekend adjustments
  let dayMultiplier = 1.0;
  if (dayOfWeek === 6) { // Saturday - busiest day
    dayMultiplier = 1.25;
  } else if (dayOfWeek === 0) { // Sunday - moderate
    dayMultiplier = 1.10;
  } else if (dayOfWeek === 5) { // Friday - busy evening
    dayMultiplier = 1.08;
  }

  // Calculate current footfall
  const calculatedFootfall = Math.round(basePeak * baseUtilization * dayMultiplier);

  // Add small random variance (+/- 5%)
  const variance = 0.95 + Math.random() * 0.10;

  return Math.round(calculatedFootfall * variance);
}

// Base performance metrics (non-time-dependent values)
const BASE_METRICS: Record<string, any> = {
  tripla: {
    deltaVsPlan: 8.3,
    weatherImpact: 6.2,
    dwellTime: 48,
    dwellDelta: 12,
    conversionRate: 32.4,
    conversionDelta: 2.1,
  },
  sello: {
    deltaVsPlan: 5.1,
    weatherImpact: 3.4,
    dwellTime: 52,
    dwellDelta: 8,
    conversionRate: 28.6,
    conversionDelta: 1.2,
  },
};

interface PropertyDetailProps {
  mallId: string;
  showPredicted?: boolean;
}

export function PropertyDetail({ mallId, showPredicted = false }: PropertyDetailProps) {
  const { t } = useTranslation('mall');
  const [activeTab, setActiveTab] = useState('overview');
  const [footfallView, setFootfallView] = useState<'chart' | 'analysis'>('chart');
  const { data: mallData, loading, error } = useMallDetail(mallId);
  const identity = useMallIdentity(mallId);

  // Calculate real footfall data for Tripla
  const basePerformance = React.useMemo(() => {
    if (mallId === 'tripla') {
      const footfallData = getTriplaCurrentFootfall();
      return {
        currentVisitors: footfallData.currentVisitors,
        deltaVsPlan: footfallData.vsPlanned,
        weatherImpact: footfallData.weatherBoost,
        dwellTime: footfallData.dwellTimeMinutes,
        dwellDelta: 12, // TODO: Calculate from baseline comparison
        conversionRate: 32.4, // TODO: Calculate from real data
        conversionDelta: 2.1, // TODO: Calculate from historical data
        alerts: [],
      };
    }
    // Use BASE_METRICS for other malls
    const baseMetrics = BASE_METRICS[mallId] || BASE_METRICS.tripla;
    return {
      currentVisitors: generateRealisticFootfall(mallId),
      ...baseMetrics,
      alerts: [],
    };
  }, [mallId]);

  // Transport, demographics, and parking data
  const [transportData, setTransportData] = useState<{ hsl?: HSLAccessibility; nysse?: NysseAccessibility; vr?: VRConnections } | null>(null);
  const [demographicsData, setDemographicsData] = useState<CatchmentDemographics | null>(null);
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [liveDepartures, setLiveDepartures] = useState<LiveDepartures | null>(null);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [locationDataLoading, setLocationDataLoading] = useState(false);

  // Generate time-aware performance metrics
  const performance = React.useMemo(() => {
    // For Tripla, use the real ground truth model
    if (mallId === 'tripla') {
      return basePerformance;
    }

    // For other malls, use the generated footfall
    const now = new Date();
    const baseMetrics = BASE_METRICS[mallId] || BASE_METRICS.tripla;
    const currentVisitors = generateRealisticFootfall(mallId, now);

    return {
      currentVisitors,
      ...baseMetrics,
    };
  }, [mallId, basePerformance]);

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
      // Support both Tripla and Ideapark
      if (mallId !== 'tripla' && mallId !== 'ideapark') return;

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
    // Support both Tripla and Ideapark
    if (mallId !== 'tripla' && mallId !== 'ideapark') return;

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

  const { summary } = mallData;

  return (
    <div className="space-y-8">
      {/* Brand Identity Header */}
      <div
        className="rounded-xl p-8 relative overflow-hidden shadow-bo-md"
        style={{
          background: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
        }}
      >
        <div className="relative z-10 flex items-center gap-5">
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
            style={{ color: identity.primaryTextColor }}
          >
            {summary.mall_name}
          </h2>
          <span
            className="text-sm px-4 py-1.5 rounded-md font-medium tracking-wide"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: identity.primaryTextColor,
            }}
          >
            {summary.city}
          </span>
        </div>
      </div>

      {/* Property Header with Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MallKPICard
          label={t('detail.totalShops')}
          value={summary.total_shops.toString()}
          delta={`${t('detail.infoUpdated')} ${new Date(summary.collection_date).toLocaleDateString()}`}
          accentColor={identity.colors.primary}
        />
        <MallKPICard
          label={t('detail.topCategory')}
          value={summary.top_categories[0]?.category || 'N/A'}
          delta={`${summary.top_categories[0]?.count || 0} ${t('detail.shops')} (${summary.top_categories[0]?.percentage.toFixed(1) || 0}%)`}
          accentColor={identity.colors.secondary}
        />
        <MallKPICard
          label={t('detail.foodBeverage')}
          value={`${summary.retailer_type_percentages['Food and beverage']?.toFixed(1) || 0}%`}
          delta={`${summary.shops_by_retailer_type['Food and beverage'] || 0} ${t('detail.shops')}`}
          accentColor={identity.colors.accent}
        />
        <MallKPICard
          label={t('detail.fashionRetail')}
          value={`${summary.retailer_type_percentages['Fashion and accessories']?.toFixed(1) || 0}%`}
          delta={`${summary.shops_by_retailer_type['Fashion and accessories'] || 0} ${t('detail.shops')}`}
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
          <TabsTrigger value="campaigns">{t('tabs.campaigns')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            {/* Tenant Mix Chart */}
            <TenantMixChart
              retailerTypePercentages={summary.retailer_type_percentages}
              totalShops={summary.total_shops}
            />

            {/* Top Categories Table */}
            <TopCategoriesTable categories={summary.top_categories} limit={10} />
          </div>

          {/* Additional Info Card */}
          <Card className="p-8 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass rounded-xl bg-bo-gradient-muted">
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-bo-neutral-600 mb-2 uppercase tracking-wider text-xs font-medium">{t('detail.infoLocation')}</p>
                <p className="text-bo-neutral-950 font-semibold tracking-tight">{summary.city}</p>
              </div>
              <div>
                <p className="text-bo-neutral-600 mb-2 uppercase tracking-wider text-xs font-medium">{t('detail.infoDataSource')}</p>
                <p className="text-bo-neutral-950 font-semibold tracking-tight">{summary.data_source}</p>
              </div>
              <div>
                <p className="text-bo-neutral-600 mb-2 uppercase tracking-wider text-xs font-medium">{t('detail.infoUpdated')}</p>
                <p className="text-bo-neutral-950 font-semibold tracking-tight">
                  {new Date(summary.collection_date).toLocaleDateString()}
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
              />
            </div>

            {/* Right Columns: Charts & Insights */}
            <div className="col-span-2 space-y-4">
              {/* Footfall view toggle — Footfall Analysis only available for Ideapark */}
              {mallId === 'ideapark' && (
                <div className="flex items-center gap-1 p-1 bg-bo-neutral-100 rounded-lg w-fit">
                  <button
                    onClick={() => setFootfallView('chart')}
                    className={
                      footfallView === 'chart'
                        ? 'px-3 py-1.5 text-sm font-medium rounded-md bg-white shadow text-bo-neutral-900 transition-all'
                        : 'px-3 py-1.5 text-sm font-medium rounded-md text-bo-neutral-500 hover:text-bo-neutral-700 transition-all'
                    }
                  >
                    {t('detail.footfallChart')}
                  </button>
                  <button
                    onClick={() => setFootfallView('analysis')}
                    className={
                      footfallView === 'analysis'
                        ? 'px-3 py-1.5 text-sm font-medium rounded-md bg-white shadow text-bo-neutral-900 transition-all'
                        : 'px-3 py-1.5 text-sm font-medium rounded-md text-bo-neutral-500 hover:text-bo-neutral-700 transition-all'
                    }
                  >
                    {t('detail.footfallAnalysis')}
                  </button>
                </div>
              )}

              {footfallView === 'analysis' && mallId === 'ideapark' ? (
                <FootfallAnalysis mallId={mallId} />
              ) : (
                <>
                  <FootfallChart mallId={mallId} showPredicted={showPredicted} />
                  <WeatherNextPanel mallId={mallId} />
                  <EventsPanel mallId={mallId} />
                  <CampaignCard mallId={mallId} />
                </>
              )}
            </div>
          </div>

          {/* Tenant Performance */}
          <TenantPerformanceTable mallId={mallId} />

          {/* Bottom Row: Alerts & Scenarios */}
          <div className="grid grid-cols-2 gap-8">
            <AlertsStream alerts={alerts} />
            <ScenarioShortcuts mallId={mallId} />
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
              retailerTypePercentages={summary.retailer_type_percentages}
              totalShops={summary.total_shops}
            />
            <TopCategoriesTable categories={summary.top_categories} limit={15} />
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

        <TabsContent value="campaigns">
          <CampaignCard mallId={mallId} expanded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
