'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { FloorplanEditor, type ZoneData, type StoreData, type CameraData } from '@/components/admin/FloorplanEditor';

const FLOOR_CONFIG: Record<string, { viewBox: string; src: string }> = {
  ground: { viewBox: '0 0 1504 704', src: '/assets/malls/ideapark/floorplan-ground.png' },
  upper: { viewBox: '0 0 1518 688', src: '/assets/malls/ideapark/floorplan-upper.png' },
};

export default function FloorplanPage() {
  const { mallId } = useParams<{ mallId: string }>();
  const { t } = useTranslation('admin');
  const [floor, setFloor] = useState<'ground' | 'upper'>('ground');
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/floorplan/${mallId}/zones?floor=${floor}`).then((r) => r.json()),
      fetch(`/api/admin/floorplan/${mallId}/stores?floor=${floor}`).then((r) => r.json()),
      fetch(`/api/admin/floorplan/${mallId}/cameras?floor=${floor}`).then((r) => r.json()),
    ]).then(([z, s, c]) => {
      setZones(z);
      setStores(s);
      setCameras(c);
      setLoading(false);
    });
  }, [mallId, floor]);

  const cfg = FLOOR_CONFIG[floor];

  return (
    <div className="flex flex-col h-full">
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
        <div className="flex-1">
          <FloorplanEditor
            key={floor}
            mallId={mallId}
            floor={floor}
            viewBox={cfg.viewBox}
            floorplanSrc={cfg.src}
            initialZones={zones}
            initialStores={stores}
            initialCameras={cameras}
          />
        </div>
      )}
    </div>
  );
}
