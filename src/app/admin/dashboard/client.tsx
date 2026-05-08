'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Map, ClipboardList, UserPlus } from 'lucide-react';
import { useAdminMall } from '@/lib/hooks/useAdminMall';

interface Props {
  zoneCount: number;
  cameraCount: number;
  pending: number;
  processing: number;
  complete: number;
}

export function AdminDashboardClient({ zoneCount, cameraCount, pending, processing, complete }: Props) {
  const { t } = useTranslation('admin');
  const { activeMallId } = useAdminMall();

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-xl font-bold text-bo-neutral-950 tracking-wide mb-6">{t('dashboard.title')}</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card label={t('dashboard.zones')} value={zoneCount} />
        <Card label={t('dashboard.cameras')} value={cameraCount} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card label={t('dashboard.jobsPending')} value={pending} />
        <Card label={t('dashboard.jobsProcessing')} value={processing} />
        <Card label={t('dashboard.jobsComplete')} value={complete} />
      </div>

      <div className="space-y-3">
        {activeMallId && (
          <QuickLink href={`/admin/floorplan/${activeMallId}`} icon={Map} label={t('dashboard.editFloorPlan')} />
        )}
        <QuickLink href="/admin/jobs" icon={ClipboardList} label={t('dashboard.manageJobs')} />
        <QuickLink href="/admin/users" icon={UserPlus} label="User Management" />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl p-5 shadow-bo-sm">
      <p className="text-sm text-bo-neutral-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-bo-neutral-950">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl shadow-bo-sm hover:shadow-bo-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <Icon className="w-5 h-5 text-bo-accent-600" />
      <span className="text-sm font-medium text-bo-neutral-950">{label}</span>
    </Link>
  );
}