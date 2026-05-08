'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import {
  getSelloTenantsByFloor,
  SELLO_TENANT_SOURCE_URLS,
  SELLO_TENANT_UPDATED_AT,
} from '@/lib/data/selloTenantMix';

const categoryTone: Record<string, string> = {
  'Food & Beverage': 'border-orange-200 bg-orange-50 text-orange-700',
  'Beauty & Health': 'border-teal-200 bg-teal-50 text-teal-700',
  Fashion: 'border-pink-200 bg-pink-50 text-pink-700',
  'Home & Living': 'border-violet-200 bg-violet-50 text-violet-700',
  'Daily Goods & Grocery': 'border-blue-200 bg-blue-50 text-blue-700',
  Leisure: 'border-green-200 bg-green-50 text-green-700',
  Services: 'border-slate-200 bg-slate-50 text-slate-700',
};

export function SelloTenantLocations({ mallId }: { mallId: string }) {
  const { t } = useTranslation('mall');
  if (mallId !== 'realidea-sello') return null;
  const floors = getSelloTenantsByFloor();
  return (
    <Card className="bo-surface-subtle bo-surface-hover overflow-hidden rounded-xl border-2 border-bo-neutral-200/60 p-0 shadow-bo-glass">
      <div className="border-b border-bo-neutral-200/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-bo-neutral-950">{t('detail.selloTenantLocations.title')}</h3>
            <p className="mt-1 text-sm text-bo-neutral-600">{t('detail.selloTenantLocations.body')}</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bo-neutral-400">
            {t('detail.infoUpdated')} {SELLO_TENANT_UPDATED_AT}
          </span>
        </div>
      </div>
      <div className="grid gap-0 divide-y divide-bo-neutral-200/60 xl:grid-cols-5 xl:divide-x xl:divide-y-0">
        {floors.map((floor) => (
          <section key={floor.floor} className="min-w-0 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-bo-neutral-950">
                {t('detail.selloTenantLocations.floor', { floor: floor.label })}
              </h4>
              <span className="rounded-full bg-bo-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-bo-neutral-600">
                {floor.tenants.length}
              </span>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {floor.tenants.map((tenant) => (
                <a key={tenant.name} href={tenant.url} target="_blank" rel="noopener noreferrer" className="group block rounded-lg border border-bo-neutral-200/70 bg-white/70 p-2 transition-colors hover:border-bo-primary-200 hover:bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-bo-neutral-900">{tenant.name}</div>
                      <div className="mt-0.5 truncate text-[10px] text-bo-neutral-500">{tenant.location}</div>
                    </div>
                    <ExternalLink size={11} className="mt-0.5 shrink-0 text-bo-neutral-300 group-hover:text-bo-primary-600" />
                  </div>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium ${categoryTone[tenant.category] ?? categoryTone.Services}`}>
                    {t(`tenants.categoryNames.${tenant.category}`, { defaultValue: tenant.category })}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="border-t border-bo-neutral-200/60 px-5 py-3 text-[10px] text-bo-neutral-500">
        {t('detail.selloTenantLocations.source')} {SELLO_TENANT_SOURCE_URLS.join(' · ')}
      </div>
    </Card>
  );
}
