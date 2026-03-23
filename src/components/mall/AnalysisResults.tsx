'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { BarChart3, ChevronDown } from 'lucide-react';
import useSWR from 'swr';

interface Job {
  id: string;
  camera: { label: string; floor: string };
  footageDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface AnalysisResult {
  zoneId: string;
  hour: number;
  count: number;
  density: number;
}

interface JobWithResults {
  id: string;
  camera: { label: string; floor: string };
  footageDate: string;
  startTime: string;
  endTime: string;
  results: AnalysisResult[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AnalysisResults({ mallId }: { mallId: string }) {
  const { t } = useTranslation('mall');
  const { data: jobs = [] } = useSWR<Job[]>(
    `/api/analysis/jobs?mallId=${mallId}&status=COMPLETE`,
    fetcher,
  );

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: jobDetail } = useSWR<JobWithResults>(
    selectedJobId ? `/api/analysis/results/${selectedJobId}` : null,
    fetcher,
  );

  if (jobs.length === 0) {
    return (
      <Card className="p-6 bg-white border-bo-neutral-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-bo-primary-500" />
          <h3 className="text-lg font-semibold text-bo-neutral-900">{t('videoAnalysis.resultsTitle')}</h3>
        </div>
        <p className="text-sm text-bo-neutral-500">{t('videoAnalysis.noCompleteJobs')}</p>
      </Card>
    );
  }

  // Group results by zone for the selected hour
  const results = jobDetail?.results ?? [];
  const hours = [...new Set(results.map((r) => r.hour))].sort((a, b) => a - b);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const activeHour = selectedHour ?? hours[0] ?? 0;
  const hourResults = results.filter((r) => r.hour === activeHour);

  return (
    <Card className="p-6 bg-white border-bo-neutral-200 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-bo-primary-500" />
        <h3 className="text-lg font-semibold text-bo-neutral-900">Analysis Results</h3>
      </div>

      {/* Job selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-bo-neutral-600 mb-1">{t('videoAnalysis.selectJob')}</label>
        <div className="relative">
          <select
            value={selectedJobId ?? ''}
            onChange={(e) => {
              setSelectedJobId(e.target.value || null);
              setSelectedHour(null);
            }}
            className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 appearance-none"
          >
            <option value="">{t('videoAnalysis.chooseJob')}</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.camera.label} &middot; {new Date(j.footageDate).toLocaleDateString()} &middot; {j.startTime}–{j.endTime}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-bo-neutral-400 pointer-events-none" />
        </div>
      </div>

      {jobDetail && results.length > 0 && (
        <>
          {/* Hour scrubber */}
          {hours.length > 1 && (
            <div className="flex gap-1 mb-4">
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHour(h)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                    activeHour === h
                      ? 'bg-bo-primary-500 text-white'
                      : 'bg-bo-neutral-100 text-bo-neutral-600 hover:bg-bo-neutral-200'
                  }`}
                >
                  {h}:00
                </button>
              ))}
            </div>
          )}

          {/* Results table */}
          <div className="border border-bo-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bo-neutral-50 border-b border-bo-neutral-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">{t('videoAnalysis.zone')}</th>
                  <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">{t('videoAnalysis.visitors')}</th>
                  <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">{t('videoAnalysis.densityPm2')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bo-neutral-100">
                {hourResults.map((r) => (
                  <tr key={r.zoneId}>
                    <td className="px-4 py-2 text-bo-neutral-900">{r.zoneId}</td>
                    <td className="px-4 py-2 text-right font-medium text-bo-neutral-900">{r.count}</td>
                    <td className="px-4 py-2 text-right text-bo-neutral-600">{r.density.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-bo-neutral-400 mt-2">
            {t('videoAnalysis.totalVisitorsAt', { hour: activeHour, count: hourResults.reduce((s, r) => s + r.count, 0) })}
          </p>
        </>
      )}

      {jobDetail && results.length === 0 && (
        <p className="text-sm text-bo-neutral-500">{t('videoAnalysis.noZoneResults')}</p>
      )}
    </Card>
  );
}
