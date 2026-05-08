'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { PlayCircle, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CampaignMallOption } from './campaignMallOptions';
import { categoryLabel, type RetailCategoryId } from '@/lib/shoppermind/retailCategories';

type Field = 'mall' | 'zone' | 'audience' | 'category';
type Segment = 'budget' | 'duration';
type Values = Record<Field | Segment | 'stores' | 'impact', string>;

const FIELDS: Field[] = ['mall', 'zone', 'audience', 'category'];
const SEGMENTS: Record<Segment, string[]> = {
  budget: ['light', 'standard', 'broad'],
  duration: ['7', '14', '30'],
};
const SELECT_OPTIONS: Record<Exclude<Field, 'mall'>, string[]> = {
  zone: ['everyday', 'station', 'restaurants', 'services'],
  audience: ['daily', 'families', 'wellness', 'commuters'],
  category: ['food-beverage', 'beauty-health', 'services', 'fashion-apparel'],
};

export interface CampaignBriefSelection { values: Values; labels: Values }
interface TenantSeed {
  categories: RetailCategoryId[];
  stores: Array<{ name: string; category: string; location: string }>;
}
interface InitialBrief {
  mall?: string;
  category?: string;
  stores?: string[];
  impact?: string;
}
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CampaignBriefBuilder({
  mallOptions,
  initialSelection,
  onCreate,
}: {
  mallOptions: CampaignMallOption[];
  initialSelection?: InitialBrief;
  onCreate: (selection: CampaignBriefSelection) => void;
}) {
  const { t, i18n } = useTranslation('mall');
  const firstEnabled = mallOptions.find((option) => option.enabled);
  const [values, setValues] = useState<Values>({
    mall: initialSelection?.mall ?? firstEnabled?.id ?? 'demo',
    zone: 'everyday',
    audience: 'daily',
    category: initialSelection?.category ?? 'food-beverage',
    stores: initialSelection?.stores?.join('|') ?? '',
    impact: initialSelection?.impact ?? '',
    budget: 'standard',
    duration: '14',
  });
  const selectedMall = values.mall === 'demo' && firstEnabled?.id ? firstEnabled.id : values.mall;
  const { data: tenantSeed } = useSWR<TenantSeed>(
    selectedMall ? `/api/shoppermind/tenant-impact?mallId=${encodeURIComponent(selectedMall)}&lang=${encodeURIComponent(i18n.language)}` : null,
    fetcher,
  );
  const selectedStores = values.stores.split('|').filter(Boolean);
  const options = useMemo(() => ({
    mall: mallOptions.length ? mallOptions : [{ id: 'demo', name: t('campaignWorkspace.fields.mall.value'), enabled: true }],
    zone: SELECT_OPTIONS.zone.map((id) => ({ id, name: t(`campaignWorkspace.fields.zone.options.${id}`) })),
    audience: SELECT_OPTIONS.audience.map((id) => ({ id, name: t(`campaignWorkspace.fields.audience.options.${id}`) })),
    category: (tenantSeed?.categories?.length ? tenantSeed.categories : SELECT_OPTIONS.category as RetailCategoryId[])
      .map((id) => ({ id, name: categoryLabel(id, i18n.language) })),
  }), [i18n.language, mallOptions, t, tenantSeed?.categories]);

  const create = () => onCreate({
    values: { ...values, mall: selectedMall },
    labels: {
      mall: options.mall.find((o) => o.id === selectedMall)?.name ?? selectedMall,
      zone: options.zone.find((o) => o.id === values.zone)?.name ?? values.zone,
      audience: options.audience.find((o) => o.id === values.audience)?.name ?? values.audience,
      category: options.category.find((o) => o.id === values.category)?.name ?? values.category,
      stores: selectedStores.join(', ') || t('campaignWorkspace.fields.stores.empty'),
      impact: values.impact,
      budget: t(`campaignWorkspace.fields.budget.options.${values.budget}`),
      duration: t(`campaignWorkspace.fields.duration.options.${values.duration}`),
    },
  });

  return (
    <div className="rounded-2xl border-2 border-bo-neutral-200 bg-white p-5 shadow-bo-glass">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bo-primary-700">
        <SlidersHorizontal size={14} />
        {t('campaignWorkspace.builder')}
      </div>
      <div className="space-y-3">
        {FIELDS.map((field) => (
          <SelectField key={field} field={field} value={field === 'mall' ? selectedMall : values[field]} options={options[field]} onChange={(next) => setValues((v) => ({ ...v, [field]: next }))} />
        ))}
        <StoreField
          stores={tenantSeed?.stores ?? []}
          selected={selectedStores}
          onToggle={(name) => setValues((v) => ({ ...v, stores: toggleStore(v.stores, name) }))}
        />
        {(['budget', 'duration'] as Segment[]).map((field) => (
          <SegmentField key={field} field={field} value={values[field]} options={SEGMENTS[field]} onChange={(next) => setValues((v) => ({ ...v, [field]: next }))} />
        ))}
      </div>
      <button onClick={create} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-bo-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bo-primary-800">
        <PlayCircle size={16} />
        {t('campaignWorkspace.createBrief')}
      </button>
    </div>
  );
}

function SelectField({ field, value, options, onChange }: { field: Field; value: string; options: Array<{ id: string; name: string; enabled?: boolean }>; onChange: (value: string) => void }) {
  const { t } = useTranslation('mall');
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-bo-neutral-600">{t(`campaignWorkspace.fields.${field}.label`)}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bo-select w-full">
        {options.map((option) => <option key={option.id} value={option.id} disabled={option.enabled === false}>{option.name}</option>)}
      </select>
    </label>
  );
}

function StoreField({ stores, selected, onToggle }: { stores: TenantSeed['stores']; selected: string[]; onToggle: (name: string) => void }) {
  const { t } = useTranslation('mall');
  if (!stores.length) return null;
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-bo-neutral-600">{t('campaignWorkspace.fields.stores.label')}</span>
      <div className="bo-surface-subtle flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border p-2">
        {stores.slice(0, 24).map((store) => {
          const active = selected.includes(store.name);
          return (
            <button key={store.name} type="button" title={store.location} onClick={() => onToggle(store.name)} className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${active ? 'border-bo-neutral-950 bg-bo-neutral-950 text-white' : 'border-bo-neutral-200 bg-white/70 text-bo-neutral-600 hover:bg-white hover:text-bo-neutral-950'}`}>
              {store.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toggleStore(current: string, name: string) {
  const next = new Set(current.split('|').filter(Boolean));
  if (next.has(name)) next.delete(name);
  else next.add(name);
  return Array.from(next).join('|');
}

function SegmentField({ field, value, options, onChange }: { field: Segment; value: string; options: string[]; onChange: (value: string) => void }) {
  const { t } = useTranslation('mall');
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-bo-neutral-600">{t(`campaignWorkspace.fields.${field}.label`)}</span>
      <div className="bo-surface-subtle grid grid-cols-3 rounded-xl border p-1">
        {options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition-colors ${option === value ? 'bg-bo-neutral-950 text-white shadow-bo-sm' : 'text-bo-neutral-600 hover:bg-white/55 hover:text-bo-neutral-950'}`}>{t(`campaignWorkspace.fields.${field}.options.${option}`)}</button>)}
      </div>
    </div>
  );
}
