'use client';

import { useMemo, useState } from 'react';
import { PlayCircle, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CampaignMallOption } from './campaignMallOptions';

type Field = 'mall' | 'zone' | 'audience';
type Segment = 'budget' | 'duration';
type Values = Record<Field | Segment, string>;

const FIELDS: Field[] = ['mall', 'zone', 'audience'];
const SEGMENTS: Record<Segment, string[]> = {
  budget: ['light', 'standard', 'broad'],
  duration: ['7', '14', '30'],
};
const SELECT_OPTIONS: Record<Exclude<Field, 'mall'>, string[]> = {
  zone: ['everyday', 'station', 'restaurants', 'services'],
  audience: ['daily', 'families', 'wellness', 'commuters'],
};

export interface CampaignBriefSelection { values: Values; labels: Values }

export function CampaignBriefBuilder({
  mallOptions,
  onCreate,
}: {
  mallOptions: CampaignMallOption[];
  onCreate: (selection: CampaignBriefSelection) => void;
}) {
  const { t } = useTranslation('mall');
  const firstEnabled = mallOptions.find((option) => option.enabled);
  const [values, setValues] = useState<Values>({ mall: firstEnabled?.id ?? 'demo', zone: 'everyday', audience: 'daily', budget: 'standard', duration: '14' });
  const selectedMall = values.mall === 'demo' && firstEnabled?.id ? firstEnabled.id : values.mall;
  const options = useMemo(() => ({
    mall: mallOptions.length ? mallOptions : [{ id: 'demo', name: t('campaignWorkspace.fields.mall.value'), enabled: true }],
    zone: SELECT_OPTIONS.zone.map((id) => ({ id, name: t(`campaignWorkspace.fields.zone.options.${id}`) })),
    audience: SELECT_OPTIONS.audience.map((id) => ({ id, name: t(`campaignWorkspace.fields.audience.options.${id}`) })),
  }), [mallOptions, t]);

  const create = () => onCreate({
    values: { ...values, mall: selectedMall },
    labels: {
      mall: options.mall.find((o) => o.id === selectedMall)?.name ?? selectedMall,
      zone: options.zone.find((o) => o.id === values.zone)?.name ?? values.zone,
      audience: options.audience.find((o) => o.id === values.audience)?.name ?? values.audience,
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
