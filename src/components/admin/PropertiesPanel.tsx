'use client';

import { useTranslation } from 'react-i18next';
import type { ZoneData, CameraData } from './FloorplanEditor';

type SelectedElement =
  | { type: 'zone'; index: number }
  | { type: 'camera'; index: number }
  | null;

interface PropertiesPanelProps {
  selected: SelectedElement;
  zones: ZoneData[];
  cameras: CameraData[];
  onUpdateZone: (i: number, patch: Partial<ZoneData>) => void;
  onUpdateCamera: (i: number, patch: Partial<CameraData>) => void;
}

// Spatial zone categories
const ZONE_CATEGORIES = [
  'Store', 'Hallway', 'Toilet', 'Stairs', 'Entrance',
  'Service', 'Storage', 'Restaurant', 'Entertainment',
  'Anchor', 'Mixed',
];

// Retail subcategories (shown when category === 'Store')
const STORE_SUBCATEGORIES = [
  'Aikuisten muoti',
  'Kahvilat & ravintolat',
  'Kauneus & terveys',
  'Autoilu',
  'Palvelut',
  'Lapsille',
  'Koti & sisustus',
  'Korut, asusteet & laukut',
  'Päivittäistavarat & tekniikka',
  'Aikuisten jalkineet',
  'Urheilu & harrastukset',
];

const INPUT_CLS = 'w-full text-sm bg-bo-neutral-50 border border-bo-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-bo-accent-600/20 focus:border-bo-accent-600 transition-all duration-300 outline-none';
const LABEL_CLS = 'block text-xs text-bo-neutral-500 font-medium mb-1';
const PANEL_CLS = 'w-72 border-l border-bo-neutral-200 bg-bo-neutral-50 p-4';
const HEADING_CLS = 'text-sm font-semibold text-bo-neutral-950 tracking-wide';

export function PropertiesPanel({
  selected,
  zones,
  cameras,
  onUpdateZone,
  onUpdateCamera,
}: PropertiesPanelProps) {
  const { t } = useTranslation('admin');

  if (!selected) {
    return (
      <div className={PANEL_CLS}>
        <p className="text-sm text-bo-neutral-400">{t('properties.selectPrompt')}</p>
      </div>
    );
  }

  if (selected.type === 'zone') {
    const zone = zones[selected.index];
    if (!zone) return null;
    return (
      <div className={`${PANEL_CLS} space-y-3 overflow-y-auto`}>
        <div className="flex items-center justify-between">
          <h3 className={HEADING_CLS}>{t('properties.zoneProperties')}</h3>
          {zone.drawShape && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bo-neutral-200 text-bo-neutral-600 uppercase tracking-wider">
              {zone.drawShape}
            </span>
          )}
        </div>
        <Field label={t('properties.zoneId')} value={zone.zoneId} onChange={(v) => onUpdateZone(selected.index, { zoneId: v })} />
        <Field label={t('properties.nameEn')} value={zone.name} onChange={(v) => onUpdateZone(selected.index, { name: v })} />
        <Field label={t('properties.nameFi')} value={zone.nameFi} onChange={(v) => onUpdateZone(selected.index, { nameFi: v })} />
        <SelectField label={t('properties.category')} value={zone.category} options={ZONE_CATEGORIES} onChange={(v) => onUpdateZone(selected.index, { category: v, subcategory: v === 'Store' ? zone.subcategory : undefined })} />
        {zone.category === 'Store' && (
          <SelectField
            label={t('properties.subcategory', 'Subcategory')}
            value={zone.subcategory ?? ''}
            options={STORE_SUBCATEGORIES}
            onChange={(v) => onUpdateZone(selected.index, { subcategory: v || undefined })}
            allowEmpty
          />
        )}
        <NumberField label={t('properties.capacity')} value={zone.capacity} onChange={(v) => onUpdateZone(selected.index, { capacity: v })} />
        <NumberField label={t('properties.areaSqm')} value={zone.areaSqm} onChange={(v) => onUpdateZone(selected.index, { areaSqm: v })} />
        <NumberField label={t('properties.baseVisitors')} value={zone.baseVisitors} onChange={(v) => onUpdateZone(selected.index, { baseVisitors: v })} />
        <NumberField label={t('properties.labelX')} value={zone.labelX} onChange={(v) => onUpdateZone(selected.index, { labelX: v })} />
        <NumberField label={t('properties.labelY')} value={zone.labelY} onChange={(v) => onUpdateZone(selected.index, { labelY: v })} />
        <div>
          <label className={LABEL_CLS}>{t('properties.svgPoints')}</label>
          <textarea
            className={`${INPUT_CLS} text-xs font-mono resize-y h-16`}
            value={zone.svgPoints}
            onChange={(e) => onUpdateZone(selected.index, { svgPoints: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (selected.type === 'camera') {
    const cam = cameras[selected.index];
    if (!cam) return null;
    return (
      <div className={`${PANEL_CLS} space-y-3 overflow-y-auto`}>
        <h3 className={HEADING_CLS}>{t('properties.cameraProperties')}</h3>
        <Field label={t('properties.label')} value={cam.label} onChange={(v) => onUpdateCamera(selected.index, { label: v })} />
        <div className="grid grid-cols-2 gap-2">
          <NumberField label={t('properties.x')} value={cam.x} onChange={(v) => onUpdateCamera(selected.index, { x: v })} />
          <NumberField label={t('properties.y')} value={cam.y} onChange={(v) => onUpdateCamera(selected.index, { y: v })} />
        </div>
        <NumberField label={t('properties.fovDeg')} value={cam.fovDeg ?? 0} onChange={(v) => onUpdateCamera(selected.index, { fovDeg: v })} />
        <NumberField label={t('properties.rangeM')} value={cam.rangeM ?? 0} onChange={(v) => onUpdateCamera(selected.index, { rangeM: v })} />
        <NumberField label={t('properties.angleDeg')} value={cam.angleDeg ?? 0} onChange={(v) => onUpdateCamera(selected.index, { angleDeg: v })} />
        <Field label={t('properties.streamUrl')} value={cam.streamUrl ?? ''} onChange={(v) => onUpdateCamera(selected.index, { streamUrl: v || undefined })} />
        <label className="flex items-center gap-2 text-xs text-bo-neutral-700">
          <input
            type="checkbox"
            checked={cam.active}
            onChange={(e) => onUpdateCamera(selected.index, { active: e.target.checked })}
          />
          {t('properties.active')}
        </label>
      </div>
    );
  }

  return null;
}

// ── Reusable form fields ──────────────────────────────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <input
        className={INPUT_CLS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <input
        type="number"
        className={INPUT_CLS}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange, allowEmpty }: { label: string; value: string; options: string[]; onChange: (v: string) => void; allowEmpty?: boolean }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <select
        className={INPUT_CLS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
