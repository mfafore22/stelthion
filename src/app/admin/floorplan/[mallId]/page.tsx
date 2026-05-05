'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { FloorplanEditor, type ZoneData, type CameraData } from '@/components/admin/FloorplanEditor';
import { getMallFloorplan, type FloorplanFloor } from '@/lib/mall/floorplanAssets';

const FLOOR_CONFIG: Record<FloorplanFloor, { label: string; viewBox: string }> = {
  ground: { label: '1', viewBox: '0 0 1504 704' },
  upper: { label: '2', viewBox: '0 0 1518 688' },
  p1: { label: 'P1', viewBox: '0 0 2072 1216' },
  floor1: { label: '1', viewBox: '0 0 2072 1216' },
  floor2: { label: '2', viewBox: '0 0 2072 1216' },
  floor3: { label: '3', viewBox: '0 0 2072 1216' },
  floor4: { label: '4', viewBox: '0 0 2072 1216' },
};

export default function FloorplanPage() {
  const { mallId } = useParams<{ mallId: string }>();
  const { t } = useTranslation('admin');
  const floors = mallId === 'realidea-sello'
    ? (['p1', 'floor1', 'floor2', 'floor3', 'floor4'] as FloorplanFloor[])
    : (['ground', 'upper'] as FloorplanFloor[]);
  const [floor, setFloor] = useState<FloorplanFloor>(floors[0]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (!cancelled) setLoading(true);
        return Promise.all([
          fetch(`/api/admin/floorplan/${mallId}/zones?floor=${floor}`).then((r) => r.json()),
          fetch(`/api/admin/floorplan/${mallId}/cameras?floor=${floor}`).then((r) => r.json()),
        ]);
      })
      .then(([z, c]) => {
        if (cancelled) return;
        setZones(Array.isArray(z) ? z : []);
        setCameras(Array.isArray(c) ? c : []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mallId, floor]);

  const cfg = FLOOR_CONFIG[floor];
  const floorplanSrc = getMallFloorplan(mallId, floor);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Floor toggle */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-bo-neutral-200 bg-bo-neutral-50">
        <span className="text-sm font-medium text-bo-neutral-700 mr-2">{t('floorplan.floor')}</span>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => setFloor(f)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-300 ${
              floor === f
                ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md'
                : 'bg-bo-neutral-100 text-bo-neutral-600 hover:bg-bo-neutral-200'
            }`}
          >
            {mallId === 'realidea-sello' ? FLOOR_CONFIG[f].label : f === 'ground' ? t('floorplan.groundFloor') : t('floorplan.upperFloor')}
          </button>
        ))}
        <span className="ml-auto text-xs text-bo-neutral-400">{t('floorplan.mall', { mallId })}</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-bo-neutral-400">
          {t('floorplan.loading')}
        </div>
      ) : (
        <div className="flex-1 h-full min-h-0">
          <FloorplanEditor
            key={floor}
            mallId={mallId}
            floor={floor}
            viewBox={cfg.viewBox}
            floorplanSrc={floorplanSrc}
            initialZones={zones}
            initialCameras={cameras}
          />
        </div>
      )}
    </div>
  );
}
