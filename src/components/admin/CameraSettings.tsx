'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { CameraData, ZoneData } from './FloorplanEditor';

const INPUT_CLS = 'w-full text-sm bg-bo-neutral-50 border border-bo-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-bo-accent-600/20 focus:border-bo-accent-600 transition-all duration-300 outline-none';
const LABEL_CLS = 'block text-xs text-bo-neutral-500 font-medium mb-1';
const SECTION_CLS = 'text-xs font-semibold text-bo-neutral-400 uppercase tracking-wider mb-3 mt-5 first:mt-0';

interface CameraSettingsProps {
  camera: CameraData & { id: string; mallId: string };
  zones: ZoneData[];
  onClose: () => void;
  onSaved: (patch: Partial<CameraData>) => void;
}

export function CameraSettings({ camera, zones, onClose, onSaved }: CameraSettingsProps) {
  const isCounter = (camera.deviceType ?? 'camera') === 'counter';

  const [form, setForm] = useState({
    label: camera.label,
    active: camera.active,
    cameraRole: camera.cameraRole ?? '',
    fovDeg: camera.fovDeg ?? 0,
    rangeM: camera.rangeM ?? 0,
    angleDeg: camera.angleDeg ?? 0,
    model: camera.model ?? '',
    resolution: camera.resolution ?? '',
    lensInfo: camera.lensInfo ?? '',
    streamUrl: camera.streamUrl ?? '',
    dataSourceUrl: camera.dataSourceUrl ?? '',
    zoneDbId: camera.zoneDbId ?? '',
    homographyMatrix: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    const dirty: Record<string, unknown> = {};
    if (form.label !== camera.label) dirty.label = form.label;
    if (form.active !== camera.active) dirty.active = form.active;
    if (form.fovDeg !== (camera.fovDeg ?? 0)) dirty.fovDeg = form.fovDeg;
    if (form.rangeM !== (camera.rangeM ?? 0)) dirty.rangeM = form.rangeM;
    if (form.angleDeg !== (camera.angleDeg ?? 0)) dirty.angleDeg = form.angleDeg;
    if (form.model !== (camera.model ?? '')) dirty.model = form.model || null;
    if (form.resolution !== (camera.resolution ?? '')) dirty.resolution = form.resolution || null;
    if (form.lensInfo !== (camera.lensInfo ?? '')) dirty.lensInfo = form.lensInfo || null;
    if (form.cameraRole !== (camera.cameraRole ?? '')) dirty.cameraRole = form.cameraRole || null;
    if (form.streamUrl !== (camera.streamUrl ?? '')) dirty.streamUrl = form.streamUrl || null;
    if (form.dataSourceUrl !== (camera.dataSourceUrl ?? '')) dirty.dataSourceUrl = form.dataSourceUrl || null;
    if (form.zoneDbId !== (camera.zoneDbId ?? '')) dirty.zoneDbId = form.zoneDbId || null;
    if (form.homographyMatrix) dirty.homographyMatrix = form.homographyMatrix;

    if (Object.keys(dirty).length === 0) {
      onClose();
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/floorplan/${camera.mallId}/cameras/${camera.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dirty),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Save failed');
        setSaving(false);
        return;
      }

      onSaved(dirty as Partial<CameraData>);
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bo-neutral-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-bo-neutral-950">
              {isCounter ? 'Counter Settings' : 'Camera Settings'}
            </h2>
            <p className="text-xs text-bo-neutral-500 mt-0.5">{camera.label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bo-neutral-100 text-bo-neutral-500 hover:text-bo-neutral-950 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Identity */}
          <p className={SECTION_CLS}>Identity</p>
          <div className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Label</label>
              <input className={INPUT_CLS} value={form.label} onChange={(e) => set('label', e.target.value)} />
            </div>
            {!isCounter && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Model</label>
                    <input className={INPUT_CLS} value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="e.g. Axis P3245-V" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Role</label>
                    <select className={INPUT_CLS} value={form.cameraRole} onChange={(e) => set('cameraRole', e.target.value)}>
                      <option value="">(none)</option>
                      {['entrance', 'zone', 'panoramic'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Resolution</label>
                    <input className={INPUT_CLS} value={form.resolution} onChange={(e) => set('resolution', e.target.value)} placeholder="e.g. 1920x1080" />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Lens</label>
                    <input className={INPUT_CLS} value={form.lensInfo} onChange={(e) => set('lensInfo', e.target.value)} placeholder="e.g. 2.8mm" />
                  </div>
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-xs text-bo-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
                className="rounded border-bo-neutral-300"
              />
              Active
            </label>
          </div>

          {/* Optics — cameras only */}
          {!isCounter && (
            <>
              <p className={SECTION_CLS}>Optics</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL_CLS}>FOV (°)</label>
                  <input type="number" className={INPUT_CLS} value={form.fovDeg} onChange={(e) => set('fovDeg', Number(e.target.value))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Range (m)</label>
                  <input type="number" className={INPUT_CLS} value={form.rangeM} onChange={(e) => set('rangeM', Number(e.target.value))} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Angle (°)</label>
                  <input type="number" className={INPUT_CLS} value={form.angleDeg} onChange={(e) => set('angleDeg', Number(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {/* Integration */}
          <p className={SECTION_CLS}>Integration</p>
          <div className="space-y-3">
            {isCounter ? (
              <div>
                <label className={LABEL_CLS}>Data Source URL</label>
                <input className={INPUT_CLS} value={form.dataSourceUrl} onChange={(e) => set('dataSourceUrl', e.target.value)} placeholder="https://..." />
              </div>
            ) : (
              <div>
                <label className={LABEL_CLS}>Stream URL (RTSP)</label>
                <input className={INPUT_CLS} value={form.streamUrl} onChange={(e) => set('streamUrl', e.target.value)} placeholder="rtsp://..." />
              </div>
            )}
            <div>
              <label className={LABEL_CLS}>Assigned Zone</label>
              <select className={INPUT_CLS} value={form.zoneDbId} onChange={(e) => set('zoneDbId', e.target.value)}>
                <option value="">(none)</option>
                {zones.filter((z) => z.id).map((z) => (
                  <option key={z.id} value={z.id!}>{z.name} ({z.zoneId})</option>
                ))}
              </select>
            </div>
            {!isCounter && (
              <div>
                <label className={LABEL_CLS}>Homography Matrix (JSON)</label>
                <textarea
                  className={`${INPUT_CLS} font-mono text-xs resize-y h-20`}
                  value={form.homographyMatrix}
                  onChange={(e) => set('homographyMatrix', e.target.value)}
                  placeholder='[[1,0,0],[0,1,0],[0,0,1]]'
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-bo-neutral-200 flex-shrink-0">
          {error ? <p className="text-xs text-red-600">{error}</p> : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-bo-neutral-600 hover:text-bo-neutral-950 border border-bo-neutral-300 rounded-lg hover:bg-bo-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-bo-neutral-950 text-white rounded-lg hover:bg-bo-neutral-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save to DB'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
