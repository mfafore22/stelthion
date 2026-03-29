'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { Cpu, Wifi, WifiOff, AlertTriangle, Clock, Trash2, Power, PowerOff } from 'lucide-react';
import '@/lib/i18n';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EdgeDevice {
  id: string;
  edgeId: string;
  mallId: string;
  version: string | null;
  gpuInfo: string | null;
  lastHeartbeat: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

export default function AdminEdgePage() {
  const { t } = useTranslation('admin');
  const { data, isLoading, mutate } = useSWR<EdgeDevice[]>(
    '/api/admin/edge/devices',
    fetcher,
    { refreshInterval: 30_000 },
  );

  const devices = data ?? [];

  const statusIcon: Record<string, React.ReactNode> = {
    ONLINE: <Wifi className="w-4 h-4 text-emerald-500" />,
    OFFLINE: <WifiOff className="w-4 h-4 text-bo-neutral-400" />,
    ERROR: <AlertTriangle className="w-4 h-4 text-red-500" />,
  };

  const statusColor: Record<string, string> = {
    ONLINE: 'bg-emerald-100 text-emerald-700',
    OFFLINE: 'bg-bo-neutral-100 text-bo-neutral-500',
    ERROR: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Cpu className="w-6 h-6 text-bo-primary-600" />
        <h1 className="text-xl font-bold text-bo-neutral-900">
          {t('edge.title', 'Edge Devices')}
        </h1>
        <span className="text-xs text-bo-neutral-400 ml-auto">
          {devices.length > 0 && `${devices.filter((d) => d.status === 'ONLINE').length}/${devices.length} online`}
        </span>
      </div>

      {isLoading && (
        <p className="text-sm text-bo-neutral-500">{t('edge.loading', 'Loading devices...')}</p>
      )}

      {!isLoading && devices.length === 0 && (
        <div className="rounded-xl border border-dashed border-bo-neutral-300 p-8 text-center">
          <Cpu className="w-8 h-8 text-bo-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-bo-neutral-500">
            {t('edge.noDevices', 'No edge devices registered yet. Edge units register automatically on first boot.')}
          </p>
        </div>
      )}

      {devices.length > 0 && (
        <div className="grid gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              statusIcon={statusIcon}
              statusColor={statusColor}
              onMutate={mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceCard({
  device,
  statusIcon,
  statusColor,
  onMutate,
}: {
  device: EdgeDevice;
  statusIcon: Record<string, React.ReactNode>;
  statusColor: Record<string, string>;
  onMutate: () => void;
}) {
  const { t } = useTranslation('admin');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleToggleStatus = useCallback(async () => {
    setBusy(true);
    try {
      const newStatus = device.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      await fetch('/api/admin/edge/devices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: device.id, status: newStatus }),
      });
      onMutate();
    } finally {
      setBusy(false);
    }
  }, [device, onMutate]);

  const handleRevoke = useCallback(async () => {
    setBusy(true);
    try {
      await fetch('/api/admin/edge/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: device.id }),
      });
      onMutate();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }, [device.id, onMutate]);

  return (
    <div className="rounded-xl border border-bo-neutral-200 bg-white p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-bo-neutral-50">
          {statusIcon[device.status] ?? statusIcon.OFFLINE}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-bo-neutral-900">{device.edgeId}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor[device.status] ?? statusColor.OFFLINE}`}>
              {t(`edge.status_${device.status.toLowerCase()}`, device.status)}
            </span>
          </div>
          <p className="text-xs text-bo-neutral-500 mt-0.5">
            {t('edge.mall', 'Mall')}: {device.mallId}
            {device.version && <> &middot; v{device.version}</>}
            {device.gpuInfo && <> &middot; {device.gpuInfo}</>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {device.lastHeartbeat && (
          <div className="flex items-center gap-1 text-xs text-bo-neutral-500 mr-2">
            <Clock className="w-3 h-3" />
            {t('edge.lastSeen', 'Last seen')}: {formatTimeAgo(device.lastHeartbeat)}
          </div>
        )}

        {/* Toggle online/offline */}
        <button
          onClick={handleToggleStatus}
          disabled={busy}
          className="p-2 rounded-lg text-bo-neutral-500 hover:bg-bo-neutral-100 hover:text-bo-neutral-800 transition-colors disabled:opacity-50"
          title={device.status === 'ONLINE'
            ? t('edge.forceOffline', 'Force offline')
            : t('edge.forceOnline', 'Force online')
          }
        >
          {device.status === 'ONLINE'
            ? <PowerOff className="w-4 h-4" />
            : <Power className="w-4 h-4" />
          }
        </button>

        {/* Revoke / delete */}
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRevoke}
              disabled={busy}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {t('editor.confirmDelete', 'Delete')}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-bo-neutral-100 text-bo-neutral-600 hover:bg-bo-neutral-200 transition-colors"
            >
              {t('editor.cancel', 'Cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="p-2 rounded-lg text-bo-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title={t('edge.revoke', 'Revoke device')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
