'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Route, ChevronDown, ArrowRight } from 'lucide-react';
import useSWR from 'swr';

interface Job {
  id: string;
  camera: { label: string; floor: string };
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  status: string;
}

interface JourneyPath {
  id: string;
  zoneSequence: string; // JSON array
  timestamps: string;   // JSON array
}

interface JourneySession {
  id: string;
  taggedCount: number;
  recognizedCount: number;
  paths: JourneyPath[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function JourneyResults({ mallId }: { mallId: string }) {
  const { t } = useTranslation('mall');
  const { data: allJobs = [] } = useSWR<Job[]>(
    `/api/analysis/jobs?mallId=${mallId}&status=COMPLETE`,
    fetcher,
  );

  // Only jobs with journey tracking
  const jobs = allJobs.filter((j) => j.journeyCount > 0);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: journeyData } = useSWR<{ sessions: JourneySession[]; originZoneId: string | null; destinationZoneId: string | null }>(
    selectedJobId ? `/api/analysis/journeys/${selectedJobId}` : null,
    fetcher,
  );
  const sessions = journeyData?.sessions ?? null;

  if (jobs.length === 0) {
    return (
      <Card className="p-6 bg-white border-bo-neutral-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-5 h-5 text-bo-primary-500" />
          <h3 className="text-lg font-semibold text-bo-neutral-900">{t('videoAnalysis.journeysTitle')}</h3>
        </div>
        <p className="text-sm text-bo-neutral-500">
          {t('videoAnalysis.noJourneyJobs')}
        </p>
      </Card>
    );
  }

  const session = sessions?.[0];
  const paths = session?.paths ?? [];

  return (
    <Card className="p-6 bg-white border-bo-neutral-200 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-bo-primary-500" />
        <h3 className="text-lg font-semibold text-bo-neutral-900">Visitor Journeys</h3>
      </div>

      {/* Job selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-bo-neutral-600 mb-1">{t('videoAnalysis.selectJourneyJob')}</label>
        <div className="relative">
          <select
            value={selectedJobId ?? ''}
            onChange={(e) => setSelectedJobId(e.target.value || null)}
            className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 appearance-none"
          >
            <option value="">{t('videoAnalysis.chooseJob')}</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.camera.label} &middot; {new Date(j.footageDate).toLocaleDateString()} &middot; {j.journeyCount} tagged
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-bo-neutral-400 pointer-events-none" />
        </div>
      </div>

      {session && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <SummaryCard label={t('videoAnalysis.tagged')} value={session.taggedCount} />
            <SummaryCard label={t('videoAnalysis.reIdentified')} value={session.recognizedCount} />
            <SummaryCard
              label={t('videoAnalysis.recognitionRate')}
              value={
                session.taggedCount > 0
                  ? `${Math.round((session.recognizedCount / session.taggedCount) * 100)}%`
                  : '–'
              }
            />
          </div>

          {/* Journey paths */}
          {paths.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-bo-neutral-700">{t('videoAnalysis.movementPaths')}</h4>
              {paths.map((path, i) => {
                let zones: string[] = [];
                try {
                  zones = JSON.parse(path.zoneSequence);
                } catch {
                  zones = [];
                }
                return (
                  <div
                    key={path.id}
                    className="flex items-center gap-1 px-3 py-2 bg-bo-neutral-50 rounded-lg text-sm text-bo-neutral-700"
                  >
                    <span className="text-xs font-medium text-bo-neutral-400 w-6">#{i + 1}</span>
                    {zones.map((z, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-bo-primary-50 text-bo-primary-700 rounded text-xs font-medium">
                          {z}
                        </span>
                        {j < zones.length - 1 && <ArrowRight className="w-3 h-3 text-bo-neutral-300" />}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-bo-neutral-500">{t('videoAnalysis.noMovementPaths')}</p>
          )}
        </>
      )}

      {selectedJobId && !sessions && (
        <p className="text-sm text-bo-neutral-400">{t('videoAnalysis.loadingJourneys')}</p>
      )}

      {selectedJobId && sessions && !session && (
        <p className="text-sm text-bo-neutral-500">{t('videoAnalysis.noJourneyData')}</p>
      )}
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-bo-neutral-50 rounded-lg p-3 text-center">
      <p className="text-xs text-bo-neutral-500">{label}</p>
      <p className="text-xl font-bold text-bo-neutral-900">{value}</p>
    </div>
  );
}
