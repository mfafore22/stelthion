/**
 * Tenant Performance Table Component
 * Category-level tenant insights
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface TenantPerformanceTableProps {
  mallId: string;
  expanded?: boolean;
}

// Mock tenant data
const TENANT_DATA = [
  { category: 'Muoti', visits: 12450, dwell: 28, sales: 42300, outlook: 12 },
  { category: 'Ravintolat & Kahvilat', visits: 8920, dwell: 52, sales: 38600, outlook: 8 },
  { category: 'Elektroniikka', visits: 4230, dwell: 18, sales: 28100, outlook: 0 },
  { category: 'Ruokakauppa', visits: 9870, dwell: 32, sales: 52800, outlook: 6 },
  { category: 'Palvelut', visits: 2770, dwell: 22, sales: 12400, outlook: -3 },
];

export function TenantPerformanceTable({ mallId, expanded = false }: TenantPerformanceTableProps) {
  const { t } = useTranslation('mall');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number) => {
    return `€${(num / 1000).toFixed(1)}k`;
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num}%`;
  };

  const getOutlookIcon = (outlook: number) => {
    if (outlook > 0) return <TrendingUp className="h-4 w-4 text-bo-success-dark" />;
    if (outlook < 0) return <TrendingDown className="h-4 w-4 text-bo-error-dark" />;
    return <Minus className="h-4 w-4 text-bo-neutral-500" />;
  };

  const getOutlookColor = (outlook: number) => {
    if (outlook > 0) return 'text-bo-success-dark';
    if (outlook < 0) return 'text-bo-error-dark';
    return 'text-bo-neutral-600';
  };

  return (
    <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
      <h3 className="mb-4 text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('tenants.performanceByCategory')}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bo-neutral-200/50">
              <th className="pb-3 text-left text-sm font-medium text-bo-neutral-600 tracking-wide">{t('tenants.category')}</th>
              <th className="pb-3 text-right text-sm font-medium text-bo-neutral-600 tracking-wide">{t('tenants.visitors')}</th>
              <th className="pb-3 text-right text-sm font-medium text-bo-neutral-600 tracking-wide">{t('tenants.dwell')}</th>
              <th className="pb-3 text-right text-sm font-medium text-bo-neutral-600 tracking-wide">{t('tenants.sales')}</th>
              <th className="pb-3 text-right text-sm font-medium text-bo-neutral-600 tracking-wide">{t('tenants.outlook')}</th>
            </tr>
          </thead>
          <tbody>
            {TENANT_DATA.map((tenant) => (
              <tr key={tenant.category} className="border-b border-bo-neutral-200/30 last:border-0">
                <td className="py-3 font-medium text-bo-neutral-950">{tenant.category}</td>
                <td className="py-3 text-right text-bo-neutral-700">{formatNumber(tenant.visits)}</td>
                <td className="py-3 text-right text-bo-neutral-700">{tenant.dwell} min</td>
                <td className="py-3 text-right text-bo-neutral-700">{formatCurrency(tenant.sales)}</td>
                <td className="py-3 text-right">
                  <div className={cn('flex items-center justify-end gap-2', getOutlookColor(tenant.outlook))}>
                    {getOutlookIcon(tenant.outlook)}
                    <span className="font-medium">
                      {tenant.outlook === 0 ? t('tenants.stable') : `${formatPercent(tenant.outlook)} ${t('tenants.vsPlan')}`}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4 border-t border-bo-neutral-200/50 pt-4">
          <h4 className="font-semibold text-bo-neutral-950">{t('tenants.topTenants')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-bo-glass-subtle p-2 border border-bo-neutral-200/30">
              <span className="text-bo-neutral-700">H&M (Muoti)</span>
              <span className="text-bo-success-dark font-medium">+18% {t('tenants.vsPlan')}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bo-glass-subtle p-2 border border-bo-neutral-200/30">
              <span className="text-bo-neutral-700">Starbucks (Ravintolat)</span>
              <span className="text-bo-success-dark font-medium">+15% {t('tenants.vsPlan')}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-bo-glass-subtle p-2 border border-bo-neutral-200/30">
              <span className="text-bo-neutral-700">Prisma (Ruokakauppa)</span>
              <span className="text-bo-success-dark font-medium">+12% {t('tenants.vsPlan')}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
