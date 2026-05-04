'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { useCounterFootfall } from '@/hooks/mall/useCounterFootfall';
import { getCurrentFootfall } from '@/lib/data/footfall';
import { getMall } from '@/lib/mall/mallDatabase';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { PortfolioPropertyCard } from '@/components/mall/portfolio/PortfolioPropertyCard';
import { MallKPICard } from '@/components/mall/ui/MallKPICard';
import { PageHero } from '@/components/mall/visuals/PageHero';

const formatCompact = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
};

export default function PortfolioPage() {
  const { user, loading } = useSession();
  const { t } = useTranslation('mall');
  const router = useRouter();
  const simulated = useMemo(() => getCurrentFootfall(), []);
  const { hasRealData, currentHourVisitors, currentHourPrevYear } = useCounterFootfall(user?.mallId ?? '');
  const mall = user?.mallId ? getMall(user.mallId) ?? null : null;

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
    if (!loading && user?.isMultiProperty) router.replace(`/tenant/${user.companyName.toLowerCase().replace(/\s+/g, '-')}/portfolio`);
  }, [loading, router, user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-bo-neutral-50"><div className="animate-pulse text-sm text-bo-neutral-400">{t('common.loading', 'Loading…')}</div></div>;
  if (!user || user.isMultiProperty) return null;

  const visitors = hasRealData ? currentHourVisitors : simulated.currentVisitors;
  const yoyDelta = hasRealData && currentHourPrevYear ? ((currentHourVisitors - currentHourPrevYear) / currentHourPrevYear) * 100 : simulated.vsPlanned;
  const deltaLabel = hasRealData ? t('kpi.vsLastYear', 'vs last year') : t('kpi.vsPlan', 'vs plan');

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto bg-bo-neutral-50 pt-[80px]">
        <div className="mx-auto max-w-[1600px] space-y-6 p-8">
          <PageHero
            icon={<Building2 className="h-6 w-6 text-bo-primary-700" />}
            title={t('portfolio.overview', 'Portfolio Overview')}
            body={t('portfolio.description', { defaultValue: 'Follow property performance, compare live operating signals, and move into the property workspace with the same working rhythm as ShopperMind and Assistants.' })}
            bannerSrc={{ title: t('portfolio.overview', 'Portfolio Overview'), primary: '#214990', secondary: '#328d2e', accent: '#f3c978' }}
            bannerAlt={t('portfolio.overview', 'Portfolio Overview')}
          />
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MallKPICard label={t('kpi.currentVisitors', 'Current Visitors')} value={formatCompact(visitors)} delta={`${yoyDelta >= 0 ? '+' : ''}${yoyDelta.toFixed(1)}% ${deltaLabel}`} deltaType={yoyDelta >= 0 ? 'positive' : 'negative'} accent="green" trendPercentage={yoyDelta} surfaceAccent={{ primary: '#328d2e', secondary: '#214990' }} />
            <MallKPICard label={t('kpi.dwellTime', 'Dwell Time')} value={hasRealData ? '--' : `${simulated.dwellTimeMinutes} min`} delta={hasRealData ? t('kpi.notAvailable', 'Not available') : `+3.5% ${t('kpi.vsBaseline', 'vs baseline')}`} deltaType={hasRealData ? 'neutral' : 'positive'} accent="blue" trendPercentage={hasRealData ? 0 : 3.5} surfaceAccent={{ primary: '#214990', secondary: '#328d2e' }} className={hasRealData ? 'opacity-60' : undefined} />
            <MallKPICard label={t('kpi.conversionRate', 'Conversion Rate')} value={hasRealData ? '--' : `${simulated.conversionRate.toFixed(1)}%`} delta={hasRealData ? t('kpi.notAvailable', 'Not available') : `+1.8% ${t('kpi.vsLastWeek', 'vs last week')}`} deltaType={hasRealData ? 'neutral' : 'positive'} accent="orange" trendPercentage={hasRealData ? 0 : 1.8} surfaceAccent={{ primary: '#b45309', secondary: '#214990' }} className={hasRealData ? 'opacity-60' : undefined} />
          </section>
          {mall && (
            <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">{t('portfolio.myProperties', 'My Properties')}</h2>
                <p className="text-sm text-bo-neutral-600">{t('portfolio.propertyWorkspaceBody', { defaultValue: 'Each property gets its own identity banner, logo placeholder, and operating summary card.' })}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <PortfolioPropertyCard
                  mallId={mall.id}
                  name={mall.name}
                  city={mall.city}
                  status={t(`portfolio.status${mall.status.charAt(0).toUpperCase()}${mall.status.slice(1)}`, mall.status)}
                  actionLabel={t('portfolio.viewProperty', 'View property details')}
                  metrics={[
                    { label: t('portfolio.retailUnits', 'Retail Units'), value: mall.stores?.toString() ?? '–', trendPercentage: 0 },
                    { label: t('portfolio.annualVisitors', 'Annual Visitors'), value: mall.annualVisitors ? formatCompact(mall.annualVisitors) : '–', trendPercentage: 2.5 },
                    { label: t('portfolio.totalArea', 'Total Area'), value: mall.gla ? `${(mall.gla / 1000).toFixed(0)}k m²` : '–', trendPercentage: 0 },
                  ]}
                  onClick={() => router.push('/mall/properties')}
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
