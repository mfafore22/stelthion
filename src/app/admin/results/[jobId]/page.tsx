'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { ArrowLeft, ArrowRight, BarChart3, Route, Clock, Video } from 'lucide-react';

interface AnalysisResult {
  zoneId: string;
  hour: number;
  count: number;
  density: number;
}

interface Camera {
  label: string;
  floor: string;
}

interface JobDetail {
  id: string;
  mallId: string;
  camera: Camera;
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  status: string;
  requestedBy: string;
  createdAt: string;
  results: AnalysisResult[];
}

interface JourneyPath {
  id: string;
  zoneSequence: string;
  timestamps: string;
}

interface JourneySession {
  id: string;
  taggedCount: number;
  recognizedCount: number;
  paths: JourneyPath[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-bo-warning-light text-bo-warning-dark border border-bo-warning-dark/20',
  PROCESSING: 'bg-bo-info-light text-bo-info-dark border border-bo-info-dark/20',
  COMPLETE: 'bg-bo-success-light text-bo-success-dark border border-bo-success-dark/20',
  FAILED: 'bg-bo-error-light text-bo-error-dark border border-bo-error-dark/20',
};

export default function AdminResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { t } = useTranslation('admin');

  const { data: job, error: jobError } = useSWR<JobDetail>(
    `/api/analysis/results/${jobId}`,
    fetcher,
    { refreshInterval: 10000 },
  );

  const { data: sessions } = useSWR<JourneySession[]>(
    job?.journeyCount && job.journeyCount > 0 ? `/api/analysis/journeys/${jobId}` : null,
    fetcher,
  );

  if (jobError) {
    return (
      <div className="p-6">
        <Link href="/admin/jobs" className="text-sm text-bo-neutral-500 hover:text-bo-neutral-950 flex items-center gap-1 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" /> {t('results.backToJobs')}
        </Link>
        <p className="text-bo-error-dark text-sm">{t('results.loadFailed')}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <Link href="/admin/jobs" className="text-sm text-bo-neutral-500 hover:text-bo-neutral-950 flex items-center gap-1 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" /> {t('results.backToJobs')}
        </Link>
        <p className="text-sm text-bo-neutral-400">{t('results.loading')}</p>
      </div>
    );
  }

  const results = job.results ?? [];
  const hours = [...new Set(results.map((r) => r.hour))].sort((a, b) => a - b);
  const session = sessions?.[0];
  const paths = session?.paths ?? [];

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Back link */}
      <Link href="/admin/jobs" className="text-sm text-bo-neutral-500 hover:text-bo-neutral-950 flex items-center gap-1 transition-colors duration-200">
        <ArrowLeft className="w-4 h-4" /> {t('results.backToJobs')}
      </Link>

      {/* Job header */}
      <div className="bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl p-5 shadow-bo-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-bo-neutral-950 flex items-center gap-2">
              <Video className="w-5 h-5 text-bo-accent-600" />
              {job.camera.label}
            </h2>
            <p className="text-sm text-bo-neutral-500 mt-1">
              {new Date(job.footageDate).toLocaleDateString()} &middot; {job.startTime}–{job.endTime} &middot; {t('results.floor', { floor: job.camera.floor })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? ''}`}>
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <InfoCard label={t('results.mall')} value={job.mallId} />
          <InfoCard label={t('results.journeyTags')} value={t('results.people', { count: job.journeyCount })} />
          <InfoCard label={t('results.requestedBy')} value={job.requestedBy} />
          <InfoCard label={t('results.created')} value={new Date(job.createdAt).toLocaleString()} />
        </div>
      </div>

      {/* Zone-level results */}
      <div className="bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl p-5 shadow-bo-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-bo-accent-600" />
          <h3 className="text-base font-semibold text-bo-neutral-950">{t('results.zoneVisitorCounts')}</h3>
        </div>

        {results.length === 0 ? (
          <p className="text-sm text-bo-neutral-500">
            {job.status === 'COMPLETE'
              ? t('results.noResults')
              : t('results.resultsPending')}
          </p>
        ) : (
          <>
            {/* Hour tabs */}
            {hours.length > 0 && (
              <HourTabs hours={hours} results={results} />
            )}
          </>
        )}
      </div>

      {/* Journey tracking */}
      {job.journeyCount > 0 && (
        <div className="bg-bo-neutral-50 border border-bo-neutral-200 rounded-xl p-5 shadow-bo-sm">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-bo-accent-600" />
            <h3 className="text-base font-semibold text-bo-neutral-950">{t('results.visitorJourneyTracking')}</h3>
            <span className="text-xs text-bo-neutral-400 ml-auto">{t('results.taggedVisitors', { count: job.journeyCount })}</span>
          </div>

          {!sessions && job.status !== 'COMPLETE' && (
            <p className="text-sm text-bo-neutral-500">{t('results.journeyPending')}</p>
          )}

          {sessions && !session && (
            <p className="text-sm text-bo-neutral-500">{t('results.noJourneySession')}</p>
          )}

          {session && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <StatCard label={t('results.taggedLabel')} value={session.taggedCount} />
                <StatCard label={t('results.reIdentified')} value={session.recognizedCount} />
                <StatCard
                  label={t('results.recognitionRate')}
                  value={
                    session.taggedCount > 0
                      ? `${Math.round((session.recognizedCount / session.taggedCount) * 100)}%`
                      : '—'
                  }
                />
              </div>

              {/* Movement paths */}
              {paths.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-bo-neutral-700 mb-2">{t('results.movementPaths')}</h4>
                  {paths.map((path, i) => {
                    let zones: string[] = [];
                    let timestamps: string[] = [];
                    try {
                      zones = JSON.parse(path.zoneSequence);
                      timestamps = JSON.parse(path.timestamps);
                    } catch {
                      /* ignore */
                    }
                    return (
                      <div
                        key={path.id}
                        className="bg-bo-neutral-100 rounded-xl p-3 border border-bo-neutral-200 shadow-bo-sm"
                      >
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-semibold text-bo-neutral-400 w-8 shrink-0">#{i + 1}</span>
                          {zones.map((z, j) => (
                            <span key={j} className="flex items-center gap-1">
                              <span className="px-2 py-1 bg-bo-accent-50 text-bo-accent-600 rounded-lg text-xs font-medium">
                                {z}
                              </span>
                              {j < zones.length - 1 && <ArrowRight className="w-3 h-3 text-bo-neutral-300" />}
                            </span>
                          ))}
                        </div>
                        {timestamps.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 ml-8 flex-wrap">
                            <Clock className="w-3 h-3 text-bo-neutral-400" />
                            {timestamps.map((ts, j) => (
                              <span key={j} className="text-[10px] text-bo-neutral-400 font-mono">
                                {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                {j < timestamps.length - 1 && ' → '}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-bo-neutral-500">{t('results.noMovementPaths')}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function HourTabs({ hours, results }: { hours: number[]; results: AnalysisResult[] }) {
  const [activeHour, setActiveHour] = useState(hours[0]);
  const { t } = useTranslation('admin');
  const hourResults = results.filter((r) => r.hour === activeHour);
  const total = hourResults.reduce((s, r) => s + r.count, 0);

  return (
    <>
      <div className="flex gap-1 mb-4 flex-wrap">
        {hours.map((h) => (
          <button
            key={h}
            onClick={() => setActiveHour(h)}
            className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
              activeHour === h
                ? 'bg-bo-accent-600 text-white shadow-bo-sm'
                : 'bg-bo-neutral-100 text-bo-neutral-600 hover:bg-bo-neutral-200'
            }`}
          >
            {h}:00
          </button>
        ))}
      </div>

      <div className="border border-bo-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bo-neutral-100 border-b border-bo-neutral-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">{t('results.zone')}</th>
              <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">{t('results.visitors')}</th>
              <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">{t('results.densityPm2')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bo-neutral-100">
            {hourResults.map((r) => (
              <tr key={r.zoneId} className="hover:bg-bo-neutral-100 transition-colors duration-200">
                <td className="px-4 py-2 text-bo-neutral-950">{r.zoneId}</td>
                <td className="px-4 py-2 text-right font-medium text-bo-neutral-950">{r.count}</td>
                <td className="px-4 py-2 text-right text-bo-neutral-600">{r.density.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-bo-neutral-400 mt-2">
        {t('results.totalVisitorsAt', { hour: activeHour, count: total })}
      </p>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-bo-neutral-500 font-medium">{label}</p>
      <p className="text-sm font-medium text-bo-neutral-950 mt-0.5">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-bo-neutral-100 rounded-xl p-3 text-center border border-bo-neutral-200">
      <p className="text-xs text-bo-neutral-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-bo-neutral-950">{value}</p>
    </div>
  );
}
