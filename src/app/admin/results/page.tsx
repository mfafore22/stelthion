'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Route, Eye, BarChart3, Store, ShieldCheck, GitBranch } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-bo-warning-light text-bo-warning-dark border border-bo-warning-dark/20',
  PROCESSING: 'bg-bo-info-light text-bo-info-dark border border-bo-info-dark/20',
  COMPLETE: 'bg-bo-success-light text-bo-success-dark border border-bo-success-dark/20',
  FAILED: 'bg-bo-error-light text-bo-error-dark border border-bo-error-dark/20',
};

const MODE_ICONS: Record<string, React.ReactNode> = {
  ZONE_COUNT: <BarChart3 className="w-3.5 h-3.5" />,
  AB_TRACKING: <Route className="w-3.5 h-3.5" />,
  JOURNEY_MAP: <Route className="w-3.5 h-3.5" />,
  STORE_BEHAVIOR: <Store className="w-3.5 h-3.5" />,
  FLOW_QUERY: <GitBranch className="w-3.5 h-3.5" />,
};

interface Job {
  id: string;
  mode: string;
  status: string;
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  progress: number;
  createdAt: string;
  camera: { label: string; floor: string } | null;
}

export default function AdminResultsIndexPage() {
  const { t } = useTranslation('admin');
  const { data: jobs } = useSWR<Job[]>('/api/admin/jobs', fetcher, {
    refreshInterval: 15_000,
  });

  // Show jobs that have results (COMPLETE, PROCESSING, or FAILED with partial data)
  const resultJobs = (jobs ?? []).filter(
    (j) => j.status === 'COMPLETE' || j.status === 'PROCESSING' || j.status === 'FAILED',
  );

  const VERIFIABLE_MODES = ['AB_TRACKING', 'JOURNEY_MAP', 'FLOW_QUERY'];
  const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;

  function isVerifiable(job: Job) {
    if (job.status !== 'COMPLETE') return false;
    if (!VERIFIABLE_MODES.includes(job.mode)) return false;
    const age = Date.now() - new Date(job.createdAt).getTime();
    return age < SEVENTY_TWO_HOURS;
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Route className="w-5 h-5 text-bo-accent-600" />
        <h2 className="text-xl font-bold text-bo-neutral-950 tracking-wide">
          {t('sidebar.resultsJourneys')}
        </h2>
      </div>

      {resultJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-bo-neutral-300 p-8 text-center">
          <Route className="w-8 h-8 text-bo-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-bo-neutral-500">
            {t('results.resultsPending', 'No completed or in-progress jobs yet.')}
          </p>
        </div>
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
                <th className="text-left px-4 py-3 font-medium text-bo-neutral-600">{t('results.verify', 'Verify')}</th>
                <th className="text-right px-4 py-3 font-medium text-bo-neutral-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bo-neutral-100">
              {resultJobs.map((job) => (
                <tr key={job.id} className="hover:bg-bo-neutral-100 transition-colors duration-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-bo-neutral-400">{MODE_ICONS[job.mode]}</span>
                      {job.camera?.label ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{new Date(job.footageDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{job.startTime}–{job.endTime}</td>
                  <td className="px-4 py-3">{job.journeyCount > 0 ? `${job.journeyCount} ${t('jobs.tagged')}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? ''}`}>
                      {job.status}
                    </span>
                    {job.status === 'PROCESSING' && job.progress > 0 && (
                      <span className="ml-2 text-[10px] text-bo-neutral-500 tabular-nums">{job.progress}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isVerifiable(job) ? (
                      <Link
                        href={`/admin/results/${job.id}/verify`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200/50 transition-all duration-300"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t('results.verify', 'Verify')}
                      </Link>
                    ) : (
                      <span className="text-[10px] text-bo-neutral-400">—</span>
                    )}
                  </td>
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
