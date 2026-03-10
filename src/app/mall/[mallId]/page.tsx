'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { PropertyKPIs } from '@/components/mall/PropertyKPIs';
import { FootfallAnalysis } from '@/components/mall/FootfallAnalysis';
import { TenantMixChart } from '@/components/mall/TenantMixChart';
import { AlertsStream } from '@/components/mall/AlertsStream';
import { CampaignCard } from '@/components/mall/CampaignCard';
import { ScenarioShortcuts } from '@/components/mall/ScenarioShortcuts';
import { getMall } from '@/lib/mall/mallDatabase';

const DEMO_TENANT_MIX: Record<string, number> = {
  'Fashion & Retail': 28,
  'Food & Beverage': 22,
  'Electronics': 14,
  'Health & Beauty': 12,
  'Sports & Leisure': 10,
  'Home & Living': 8,
  'Services': 6,
};

const DEMO_ALERTS = [
  { level: 'info' as const, message: 'Peak hour approaching at 14:00', time: '5m ago' },
  { level: 'info' as const, message: 'Footfall +8.7% vs plan today', time: '1h ago' },
];

export default function MallDetailPage() {
  const { mallId } = useParams<{ mallId: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dataView, setDataView] = useState<'actual' | 'predicted'>('actual');

  const mall = getMall(mallId);

  if (!mall) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-mall-neutral-500">Mall not found: {mallId}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-mall-neutral-100">
      <MallLeftNav />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MallTopBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          dataView={dataView}
          onDataViewChange={setDataView}
          pageTitle={mall.name}
        />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Mall header */}
          <div>
            <h1 className="text-2xl font-bold text-mall-neutral-900">{mall.name}</h1>
            <p className="text-sm text-mall-neutral-500">
              {mall.city}, Finland &middot; {mall.stores} stores &middot; {(mall.gla ?? 0).toLocaleString()} m² GLA
            </p>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-4">
            <PropertyKPIs
              currentVisitors={4820}
              deltaVsPlan={8.7}
              weatherImpact={3.2}
              dwellTime={47}
              dwellDelta={12.0}
              conversionRate={23.4}
              conversionDelta={5.2}
              alerts={DEMO_ALERTS}
            />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left/centre — footfall + tenant mix */}
            <div className="col-span-2 space-y-6">
              <FootfallAnalysis mallId={mallId} />
              <TenantMixChart
                retailerTypePercentages={DEMO_TENANT_MIX}
                totalShops={mall.stores ?? 200}
              />
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <AlertsStream alerts={DEMO_ALERTS} />
              <ScenarioShortcuts mallId={mallId} />
              <CampaignCard mallId={mallId} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
