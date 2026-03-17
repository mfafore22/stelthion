'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Eye } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-bo-warning-light text-bo-warning-dark border border-bo-warning-dark/20',
  PROCESSING: 'bg-bo-info-light text-bo-info-dark border border-bo-info-dark/20',
  COMPLETE: 'bg-bo-success-light text-bo-success-dark border border-bo-success-dark/20',
  FAILED: 'bg-bo-error-light text-bo-error-dark border border-bo-error-dark/20',
};

interface SerializedJob {
  id: string;
  cameraLabel: string;
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  status: string;
  createdAt: string;
}

export function AdminJobsClient({ jobs }: { jobs: SerializedJob[] }) {
  const { t } = useTranslation('admin');

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-xl font-bold text-bo-neutral-950 tracking-wide mb-6">{t('jobs.title')}</h2>

      {jobs.length === 0 ? (
        <p className="text-bo-neutral-500 text-sm">{t('jobs.noJobs')}</p>
      ) : (
        <div className="bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl shadow-bo-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bo-neutral-100 border-b border-bo-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('jobs.camera')}</th>
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('jobs.date')}</th>
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('jobs.time')}</th>
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('jobs.journey')}</th>
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('jobs.status')}</th>
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('jobs.requested')}</th>
                <th className="text-right px-4 py-3 font-medium text-bo-neutral-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bo-neutral-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-bo-neutral-100 transition-colors duration-200">
                  <td className="px-4 py-3">{job.cameraLabel}</td>
                  <td className="px-4 py-3">{new Date(job.footageDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{job.startTime}–{job.endTime}</td>
                  <td className="px-4 py-3">{job.journeyCount} {t('jobs.tagged')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? ''}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bo-neutral-500">{new Date(job.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/results/${job.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-bo-accent-600 bg-bo-accent-50 rounded-lg hover:bg-bo-accent-100 transition-all duration-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t('jobs.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
