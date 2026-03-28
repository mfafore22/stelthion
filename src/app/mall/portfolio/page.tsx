'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallKPICard } from '@/components/mall/ui/MallKPICard';
import { getCurrentFootfall } from '@/lib/data/footfall';
import { useCounterFootfall } from '@/hooks/mall/useCounterFootfall';
import { MALLS } from '@/lib/mall/mallDatabase';
import { Building2, MapPin, Store, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function PortfolioPage() {
  const { user, loading } = useSession();
  const { t } = useTranslation('mall');
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const simulated = useMemo(() => getCurrentFootfall(), []);

  const {
    hasRealData,
    currentHourVisitors,
    currentHourPrevYear,
  } = useCounterFootfall(user?.mallId ?? '');

  const mall = useMemo(() => {
    if (!user?.mallId) return null;
    return MALLS[user.mallId] ?? null;
  }, [user?.mallId]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mall/login');
    } else if (!loading && user?.isMultiProperty) {
      const tenantSlug = user.companyName.toLowerCase().replace(/\s+/g, '-');
      router.replace(`/tenant/${tenantSlug}/portfolio`);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F6F3]">
        <div className="animate-pulse text-gray-400 text-sm">
          {t('common.loading', 'Loading…')}
        </div>
      </div>
    );
  }

  if (!user || user.isMultiProperty) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const formatPercent = (num: number) =>
    `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;

  return (
    <>
      <MallLeftNav />
      <MallTopBar selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <main className="ml-[80px] mt-[80px] h-[calc(100vh-80px)] overflow-auto bg-[#F8F6F3]">
        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Page title */}
          <h1 className="text-2xl font-semibold tracking-tight text-bo-neutral-950 mb-8">
            {t('portfolio.overview', 'Portfolio Overview')}
          </h1>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(() => {
              const visitors = hasRealData ? currentHourVisitors : simulated.currentVisitors;
              const yoyDelta = hasRealData && currentHourPrevYear
                ? ((currentHourVisitors - currentHourPrevYear) / currentHourPrevYear) * 100
                : simulated.vsPlanned;
              const deltaRounded = Math.round(yoyDelta * 10) / 10;
              const deltaLabel = hasRealData ? t('kpi.vsLastYear', 'vs last year') : t('kpi.vsPlan', 'vs plan');
              return (
                <MallKPICard
                  label={t('kpi.currentVisitors', 'Current Visitors')}
                  value={formatNumber(visitors)}
                  delta={`${formatPercent(deltaRounded)} ${deltaLabel}`}
                  deltaType={deltaRounded >= 0 ? 'positive' : 'negative'}
                  accent="green"
                  trendPercentage={deltaRounded}
                />
              );
            })()}
            <div className={hasRealData ? 'opacity-60' : undefined}>
              <MallKPICard
                label={t('kpi.dwellTime', 'Dwell Time')}
                value={hasRealData ? '--' : `${simulated.dwellTimeMinutes} min`}
                delta={hasRealData ? t('kpi.notAvailable', 'Not available') : `${formatPercent(3.5)} ${t('kpi.vsBaseline', 'vs baseline')}`}
                deltaType={hasRealData ? 'neutral' : 'positive'}
                accent="blue"
                trendPercentage={hasRealData ? 0 : 3.5}
              />
            </div>
            <div className={hasRealData ? 'opacity-60' : undefined}>
              <MallKPICard
                label={t('kpi.conversionRate', 'Conversion Rate')}
                value={hasRealData ? '--' : `${simulated.conversionRate.toFixed(1)}%`}
                delta={hasRealData ? t('kpi.notAvailable', 'Not available') : `${formatPercent(1.8)} ${t('kpi.vsLastWeek', 'vs last week')}`}
                deltaType={hasRealData ? 'neutral' : 'positive'}
                accent="orange"
                trendPercentage={hasRealData ? 0 : 1.8}
              />
            </div>
          </div>

          {/* Property Card */}
          {mall && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-800 mb-4">
                {t('portfolio.myProperties', 'My Properties')}
              </h2>
              <button
                onClick={() => router.push(`/mall/properties`)}
                className="w-full text-left group"
              >
                <div
                  className="rounded-xl overflow-hidden border-2 border-bo-neutral-300/60 shadow-bo-glass-strong backdrop-blur-xl bg-bo-glass transition-all duration-300 hover:shadow-bo-xl hover:-translate-y-0.5"
                >
                  {/* Brand gradient header */}
                  <div
                    className="h-2 w-full"
                    style={{
                      background: `linear-gradient(to right, #264d21, #1a3a15)`,
                    }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: '#328d2e20' }}
                        >
                          <Building2
                            className="h-6 w-6"
                            style={{ color: '#328d2e' }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold tracking-tight text-bo-neutral-950">
                            {mall.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-bo-neutral-600">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{mall.city}, {t('common.finland', 'Finland')}</span>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide bg-bo-success/10 text-bo-success-dark uppercase">
                        {t(`portfolio.status${mall.status.charAt(0).toUpperCase()}${mall.status.slice(1)}`, mall.status)}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-bo-neutral-200/50">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-bo-neutral-500" />
                        <div>
                          <div className="text-sm font-semibold text-bo-neutral-950">
                            {mall.stores ?? '—'}
                          </div>
                          <div className="text-xs text-bo-neutral-500">
                            {t('portfolio.retailUnits', 'Retail Units')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-bo-neutral-500" />
                        <div>
                          <div className="text-sm font-semibold text-bo-neutral-950">
                            {mall.annualVisitors
                              ? formatNumber(mall.annualVisitors)
                              : '—'}
                          </div>
                          <div className="text-xs text-bo-neutral-500">
                            {t('portfolio.annualVisitors', 'Annual Visitors')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-bo-neutral-500" />
                        <div>
                          <div className="text-sm font-semibold text-bo-neutral-950">
                            {mall.gla
                              ? `${(mall.gla / 1000).toFixed(0)}k m²`
                              : '—'}
                          </div>
                          <div className="text-xs text-bo-neutral-500">
                            {t('portfolio.totalArea', 'Total Area')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action hint */}
                    <div className="flex items-center justify-end mt-4 text-sm font-medium text-bo-neutral-500 group-hover:text-bo-success-dark transition-colors">
                      <span>{t('portfolio.viewProperty', 'View property details')}</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
