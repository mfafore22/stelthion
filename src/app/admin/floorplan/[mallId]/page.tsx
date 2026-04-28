'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { FloorplanEditor, type ZoneData, type CameraData } from '@/components/admin/FloorplanEditor';

const FLOOR_CONFIG: Record<string, { viewBox: string }> = {
  ground: { viewBox: '0 0 1504 704' },
  upper: { viewBox: '0 0 1518 688' },
};

export default function FloorplanPage() {
  const { mallId } = useParams<{ mallId: string }>();
  const { t } = useTranslation('admin');
  const [floor, setFloor] = useState<'ground' | 'upper'>('ground');
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/floorplan/${mallId}/zones?floor=${floor}`).then((r) => r.json()),
      fetch(`/api/admin/floorplan/${mallId}/cameras?floor=${floor}`).then((r) => r.json()),
    ]).then(([z, c]) => {
      setZones(Array.isArray(z) ? z : []);
      setCameras(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, [mallId, floor]);

  const cfg = FLOOR_CONFIG[floor];
  const floorplanSrc = `/assets/malls/${mallId}/floorplan-${floor}.png`;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Floor toggle */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-bo-neutral-200 bg-bo-neutral-50">
        <span className="text-sm font-medium text-bo-neutral-700 mr-2">{t('floorplan.floor')}</span>
        {(['ground', 'upper'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFloor(f)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-300 ${
              floor === f
                ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md'
                : 'bg-bo-neutral-100 text-bo-neutral-600 hover:bg-bo-neutral-200'
            }`}
          >
            {f === 'ground' ? t('floorplan.groundFloor') : t('floorplan.upperFloor')}
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
