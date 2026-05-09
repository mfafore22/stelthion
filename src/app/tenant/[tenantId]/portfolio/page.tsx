'use client';

import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Building2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from '@/lib/i18n/hooks';
import { getOperatorLogoOrFallback } from '@/lib/mall/operatorLogos';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { PortfolioPropertyCard } from '@/components/mall/portfolio/PortfolioPropertyCard';
import { MallKPICard } from '@/components/mall/ui/MallKPICard';
import { PageHero } from '@/components/mall/visuals/PageHero';

const TENANT_MAP: Record<string, string> = { ideapark: 'Koy Ideapark Ab', 'realidea-oy': 'Realidea Oy' };
const fetcher = async (url: string) => { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
const compact = (num: number, currency = false) => num >= 1_000_000 ? `${currency ? '€' : ''}${(num / 1_000_000).toFixed(currency ? 0 : 1)}M` : num >= 1000 ? `${(num / 1000).toFixed(1)}k` : `${currency ? '€' : ''}${num.toLocaleString()}`;

interface CustomerMall { mallId: string; name: string; city: string; status: 'LIVE' | 'BETA' | 'ALPHA' | 'PLANNED'; totalShops: number | null; stats: { currentVisitors: number; annualVisitors: number; annualSales: number } | null; }
interface CustomerResponse { id: string; name: string; malls: CustomerMall[]; }

export default function TenantPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useSession();
  const { t } = useTranslation(['mall', 'kpi']);
  const tenantId = params?.tenantId as string | undefined;
  const tenantName = tenantId ? TENANT_MAP[tenantId] : '';
  const { data } = useSWR<CustomerResponse>(user && tenantId ? `/api/customers/${tenantId}` : null, fetcher);
  const operatorLogo = getOperatorLogoOrFallback(tenantName);

  useEffect(() => {
    if (!loading && !user) router.push('/mall/login');
    if (!loading && user && tenantId) {
      const ownTenant = Object.entries(TENANT_MAP).find(([, name]) => name === user.companyName)?.[0];
      if (ownTenant && ownTenant !== tenantId) router.push(`/tenant/${ownTenant}/portfolio`);
    }
  }, [loading, router, tenantId, user]);

  const malls = useMemo(() => (data?.malls ?? []).map((mall) => ({
    id: mall.mallId,
    name: mall.name,
    city: mall.city,
    status: mall.status,
    currentVisitors: mall.stats?.currentVisitors ?? 0,
    annualVisitors: mall.stats?.annualVisitors ?? 0,
    annualSales: mall.stats?.annualSales ?? 0,
    totalShops: mall.totalShops ?? 0,
  })), [data]);
  const totals = useMemo(() => ({
    count: malls.length,
    visitors: malls.reduce((sum, mall) => sum + mall.annualVisitors, 0),
    sales: malls.reduce((sum, mall) => sum + mall.annualSales, 0),
  }), [malls]);

  if (loading || !user) return <div className="flex h-64 items-center justify-center"><div className="text-sm text-bo-neutral-400">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-bo-neutral-50">
      <MallLeftNav managementCompanyId={tenantId || ''} onNavigate={() => undefined} />
      <MallTopBar />
      <main className="ml-[80px] mt-[80px] p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <PageHero
            icon={<Building2 className="h-6 w-6 text-bo-primary-700" />}
            title={tenantName}
            body={t('mall:portfolio.operatorHeroBody', { defaultValue: 'Track the portfolio at operator level, compare mall operating signals, and open each property in a branded workspace card.' })}
            bannerSrc={{ title: tenantName, primary: '#214990', secondary: '#328d2e', accent: '#f3c978' }}
            bannerAlt={tenantName}
            rightSlot={<LogoBox logo={operatorLogo} name={tenantName} />}
          />
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MallKPICard label={t('mall:portfolio.currentVisitors')} value={compact(malls.reduce((sum, mall) => sum + mall.currentVisitors, 0))} delta={t('mall:portfolio.liveDataPending')} deltaType="neutral" accent="green" trendPercentage={0} surfaceAccent={{ primary: '#328d2e', secondary: '#214990' }} />
            <MallKPICard label={t('mall:portfolio.annualVisitors')} value={compact(totals.visitors)} delta={`${totals.count} ${t('mall:portfolio.shoppingCenters', { count: totals.count })}`} accent="blue" trendPercentage={3.2} surfaceAccent={{ primary: '#214990', secondary: '#328d2e' }} />
            <MallKPICard label={t('mall:portfolio.annualSales')} value={compact(totals.sales, true)} delta={t('mall:portfolio.propertyOperator')} accent="orange" trendPercentage={2.1} surfaceAccent={{ primary: '#b45309', secondary: '#214990' }} />
          </section>
          <section className="bo-surface rounded-2xl border-2 border-bo-primary-200/60 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-bo-neutral-950">{t('mall:portfolio.portfolioProperties', { count: malls.length })}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {malls.map((mall) => (
                <PortfolioPropertyCard
                  key={mall.id}
                  mallId={mall.id}
                  name={mall.name}
                  city={mall.city}
                  status={mall.status}
                  actionLabel={t('mall:portfolio.viewProperty', { defaultValue: 'Open property' })}
                  metrics={[
                    { label: t('mall:portfolio.currentVisitors'), value: compact(mall.currentVisitors), trendPercentage: 3.2 },
                    { label: t('mall:portfolio.annualVisitors'), value: compact(mall.annualVisitors), trendPercentage: 2.6 },
                    { label: t('mall:portfolio.annualSales'), value: compact(mall.annualSales, true), trendPercentage: 2.1 },
                  ]}
                  onClick={() => router.push(`/mall/${mall.id}`)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function LogoBox({ logo, name }: { logo: { type: 'image' | 'letter'; value: string }; name: string }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-bo-neutral-200 bg-white shadow-bo-sm">
      {logo.type === 'image' ? (
        <Image src={logo.value} alt={`${name} logo`} fill={false} width={56} height={56} className="h-12 w-12 object-contain" />
      ) : (
        <span className="text-xl font-semibold text-bo-primary-700">{logo.value}</span>
      )}
    </div>
  );
}
