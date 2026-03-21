'use client';

import { useTranslation } from 'react-i18next';
import { Video, MapPin, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODE_META } from './constants';
import type { AnalysisMode, Camera, Zone } from './types';

interface SelectionSummaryProps {
  cameras: Camera[];
  zones: Zone[];
  selectedCameraIds: string[];
  selectedZoneIds: string[];
  detectedMode: AnalysisMode | null;
  onDeselectCamera: (id: string) => void;
  onDeselectZone: (id: string) => void;
  onClearAll: () => void;
}

export function SelectionSummary({
  cameras,
  zones,
  selectedCameraIds,
  selectedZoneIds,
  detectedMode,
  onDeselectCamera,
  onDeselectZone,
  onClearAll,
}: SelectionSummaryProps) {
  const { t, i18n } = useTranslation('mall');
  const isFi = i18n.language === 'fi';

  const hasSelection = selectedCameraIds.length > 0 || selectedZoneIds.length > 0;

  if (!hasSelection) {
    return (
      <div className="rounded-xl border-2 border-dashed border-bo-neutral-200 bg-bo-neutral-50/50 p-5 text-center mb-4">
        <p className="text-sm text-bo-neutral-500 font-medium">
          {t('videoAnalysis.unified.emptySelection')}
        </p>
        <p className="text-xs text-bo-neutral-400 mt-1">
          {t('videoAnalysis.unified.emptySelectionHint')}
        </p>
      </div>
    );
  }

  const modeMeta = detectedMode ? MODE_META[detectedMode] : null;

  return (
    <div className="rounded-xl bg-bo-neutral-50 border border-bo-neutral-200 p-4 mb-4">
      {/* Selection chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {selectedCameraIds.map((id, idx) => {
          const cam = cameras.find((c) => c.id === id);
          if (!cam) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onDeselectCamera(id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-bo-accent-50 text-bo-accent-700 border border-bo-accent-200 hover:bg-bo-accent-100 transition-colors duration-200"
            >
              <Video className="w-3 h-3" />
              <span className="font-bold mr-0.5">{String.fromCharCode(65 + idx)}</span>
              {cam.label}
              <X className="w-3 h-3 text-bo-accent-400" />
            </button>
          );
        })}

        {selectedZoneIds.map((id) => {
          const zone = zones.find((z) => z.id === id);
          if (!zone) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onDeselectZone(id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-bo-primary-50 text-bo-primary-700 border border-bo-primary-200 hover:bg-bo-primary-100 transition-colors duration-200"
            >
              <MapPin className="w-3 h-3" />
              {isFi ? zone.nameFi : zone.name}
              <X className="w-3 h-3 text-bo-primary-400" />
            </button>
          );
        })}

        {(selectedCameraIds.length + selectedZoneIds.length > 1) && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-bo-neutral-500 hover:text-bo-error-dark hover:bg-bo-error-light transition-colors duration-200"
          >
            <Trash2 className="w-3 h-3" />
            {t('videoAnalysis.unified.clearAll')}
          </button>
        )}
      </div>

      {/* Auto-detected mode badge */}
      {modeMeta && (
        <div className="flex items-center gap-2">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
            modeMeta.color,
          )}>
            <modeMeta.icon className="w-3.5 h-3.5" />
            {t(modeMeta.labelKey)}
          </div>
          <span className="text-[11px] text-bo-neutral-500">
            {t(modeMeta.descKey)}
          </span>
        </div>
      )}
    </div>
  );
}
