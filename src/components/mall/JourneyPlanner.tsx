'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Calendar, Clock, Users, Send, ChevronDown, ArrowRight } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { usePublishedFloorplan } from '@/hooks/usePublishedFloorplan';

interface Camera {
  id: string;
  label: string;
  floor: string;
  x: number;
  y: number;
}

interface Job {
  id: string;
  camera: { label: string; floor: string };
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  originZoneId: string | null;
  destinationZoneId: string | null;
  status: string;
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

interface JourneyResponse {
  sessions: JourneySession[];
  originZoneId: string | null;
  destinationZoneId: string | null;
}

const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
}).filter((t) => t <= '21:00');

const JOURNEY_OPTIONS = [1, 5, 10, 15, 20];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function JourneyPlanner({ mallId }: { mallId: string }) {
  const { t, i18n } = useTranslation('mall');
  const published = usePublishedFloorplan(mallId);
  const isFi = i18n.language === 'fi';
  const zoneName = (z: { name: string; nameFi: string }) => isFi ? z.nameFi : z.name;

  // All zones from both floors
  const allZones = useMemo(() => {
    const byFloor = Object.values(published.byFloor).flatMap((entry) => entry.zones);
    return byFloor.length ? byFloor : [...(published.groundZones ?? []), ...(published.upperZones ?? [])];
  }, [published.byFloor, published.groundZones, published.upperZones]);

  // Cameras for filtering by zone
  const { data: cameras = [] } = useSWR<Camera[]>(
    `/api/floorplan/${mallId}/cameras`,
    fetcher,
  );

  // Journey planner jobs
  const { data: jobs = [] } = useSWR<Job[]>(
    `/api/analysis/jobs?mallId=${mallId}&status=COMPLETE&type=journey-planner`,
    fetcher,
    { refreshInterval: 15000 },
  );

  // Form state
  const [originZoneId, setOriginZoneId] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [destinationZoneId, setDestinationZoneId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [journeyCount, setJourneyCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: journeyData } = useSWR<JourneyResponse>(
    selectedJobId ? `/api/analysis/journeys/${selectedJobId}` : null,
    fetcher,
  );

  // Filter cameras to selected origin zone
  // Cameras don't have zoneDbId exposed in the public API, so we match by position proximity
  // For now, show all cameras and let user pick
  const availableCameras = cameras;

  // Destination zones exclude origin
  const destinationZones = allZones.filter((z) => z.id !== originZoneId);

  // Compute results
  const session = journeyData?.sessions?.[0];
  const paths = useMemo(() => session?.paths ?? [], [session?.paths]);
  const destZoneId = journeyData?.destinationZoneId;

  const arrivedCount = useMemo(() => {
    if (!destZoneId || paths.length === 0) return 0;
    return paths.filter((p) => {
      try {
        const zones: string[] = JSON.parse(p.zoneSequence);
        return zones.includes(destZoneId);
      } catch {
        return false;
      }
    }).length;
  }, [paths, destZoneId]);

  const intermediateZones = useMemo(() => {
    if (paths.length === 0) return [];
    const freq: Record<string, number> = {};
    const origin = journeyData?.originZoneId;
    const dest = journeyData?.destinationZoneId;
    for (const p of paths) {
      try {
        const zones: string[] = JSON.parse(p.zoneSequence);
        for (const z of zones) {
          if (z !== origin && z !== dest) {
            freq[z] = (freq[z] ?? 0) + 1;
          }
        }
      } catch { /* skip */ }
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .map(([zone, count]) => ({ zone, count }));
  }, [paths, journeyData?.originZoneId, journeyData?.destinationZoneId]);

  const destZoneMatch = allZones.find((z) => z.id === destZoneId);
  const destZoneName = destZoneMatch ? zoneName(destZoneMatch) : destZoneId ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraId || !date || !originZoneId || !destinationZoneId) return;
    setSubmitting(true);
    try {
      await fetch('/api/analysis/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mallId,
          cameraId,
          footageDate: date,
          startTime,
          endTime,
          journeyCount,
          originZoneId,
          destinationZoneId,
          requestedBy: mallId,
        }),
      });
      mutate(`/api/analysis/jobs?mallId=${mallId}&status=COMPLETE&type=journey-planner`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-bo-neutral-200 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="w-5 h-5 text-bo-primary-500" />
        <h3 className="text-lg font-semibold text-bo-neutral-900">{t('journeyPlanner.title')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin + Camera + Destination */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Origin zone */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <MapPin className="w-3.5 h-3.5" /> {t('journeyPlanner.originZone')}
            </label>
            <select
              value={originZoneId}
              onChange={(e) => {
                setOriginZoneId(e.target.value);
                setCameraId('');
                if (destinationZoneId === e.target.value) setDestinationZoneId('');
              }}
              className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950"
            >
              <option value="">{t('journeyPlanner.selectZone')}</option>
              {allZones.map((z) => (
                <option key={z.id} value={z.id}>{zoneName(z)}</option>
              ))}
            </select>
          </div>

          {/* Camera in origin zone */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <MapPin className="w-3.5 h-3.5" /> {t('journeyPlanner.originCamera')}
            </label>
            {availableCameras.length === 0 ? (
              <p className="text-xs text-bo-neutral-400 py-2">{t('journeyPlanner.noCameras')}</p>
            ) : (
              <select
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950"
                disabled={!originZoneId}
              >
                <option value="">{t('journeyPlanner.selectCamera')}</option>
                {availableCameras.map((c) => (
                  <option key={c.id} value={c.id}>{c.label} ({c.floor === 'ground' ? t('heatmap.groundFloor') : t('heatmap.upperFloor')})</option>
                ))}
              </select>
            )}
          </div>

          {/* Destination zone */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <Navigation className="w-3.5 h-3.5" /> {t('journeyPlanner.destination')}
            </label>
            <select
              value={destinationZoneId}
              onChange={(e) => setDestinationZoneId(e.target.value)}
              className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950"
              disabled={!originZoneId}
            >
              <option value="">{t('journeyPlanner.selectZone')}</option>
              {destinationZones.map((z) => (
                <option key={z.id} value={z.id}>{zoneName(z)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time + Journey Count */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <Calendar className="w-3.5 h-3.5" /> {t('journeyPlanner.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
              required
              className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <Clock className="w-3.5 h-3.5" /> {t('journeyPlanner.timeRange')}
            </label>
            <div className="flex items-center gap-1">
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 text-sm border border-bo-neutral-200 rounded-lg px-2 py-2 bg-white text-bo-neutral-950"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <span className="text-xs text-bo-neutral-400">-</span>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 text-sm border border-bo-neutral-200 rounded-lg px-2 py-2 bg-white text-bo-neutral-950"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
              <Users className="w-3.5 h-3.5" /> {t('journeyPlanner.journeyCount')}
            </label>
            <div className="flex gap-1">
              {JOURNEY_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setJourneyCount(n)}
                  className={`flex-1 text-xs py-2 rounded-lg border transition-all duration-300 ${
                    journeyCount === n
                      ? 'bg-bo-primary-500 text-white border-bo-primary-600'
                      : 'bg-white text-bo-neutral-600 border-bo-neutral-200 hover:bg-bo-neutral-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-bo-neutral-400 italic">
              {t('journeyPlanner.journeyCountDisclaimer')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !originZoneId || !destinationZoneId || !cameraId || !date}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-bo-primary-500 text-white hover:bg-bo-primary-600 disabled:opacity-60 transition-all duration-300"
        >
          <Send className="w-4 h-4" />
          {submitting ? t('journeyPlanner.scheduling') : t('journeyPlanner.schedule')}
        </button>
      </form>

      {/* ── Results Section ─────────────────────────────────────────── */}
      <div className="mt-8 border-t border-bo-neutral-100 pt-6">
        <h4 className="text-sm font-semibold text-bo-neutral-900 mb-3">{t('journeyPlanner.recentJobs')}</h4>

        {jobs.length === 0 ? (
          <p className="text-sm text-bo-neutral-500">{t('journeyPlanner.noJobs')}</p>
        ) : (
          <>
            {/* Job selector */}
            <div className="mb-4 relative">
              <select
                value={selectedJobId ?? ''}
                onChange={(e) => setSelectedJobId(e.target.value || null)}
                className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2 bg-white text-bo-neutral-950 appearance-none"
              >
                <option value="">{t('journeyPlanner.chooseJob')}</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.camera.label} &middot; {new Date(j.footageDate).toLocaleDateString()} &middot; {j.startTime}–{j.endTime} &middot; {j.journeyCount} tracked
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-bo-neutral-400 pointer-events-none" />
            </div>

            {/* Headline stat */}
            {session && destZoneId && (
              <div className="space-y-4">
                <div className="bg-bo-primary-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-bo-primary-700">
                    {arrivedCount > 0
                      ? t('journeyPlanner.reached', {
                          count: arrivedCount,
                          total: session.taggedCount,
                          zone: destZoneName,
                        })
                      : t('journeyPlanner.notReached', { zone: destZoneName })}
                  </p>
                </div>

                {/* Intermediate zones table */}
                {intermediateZones.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-bo-neutral-700 mb-2">
                      {t('journeyPlanner.intermediateZones')}
                    </h5>
                    <div className="bg-bo-neutral-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-bo-neutral-200">
                            <th className="text-left px-3 py-2 font-medium text-bo-neutral-600">
                              {t('journeyPlanner.zone')}
                            </th>
                            <th className="text-right px-3 py-2 font-medium text-bo-neutral-600">
                              {t('journeyPlanner.visitCount')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {intermediateZones.map(({ zone, count }) => {
                            const match = allZones.find((z) => z.id === zone);
                            const label = match ? zoneName(match) : zone;
                            return (
                              <tr key={zone} className="border-b border-bo-neutral-100 last:border-0">
                                <td className="px-3 py-2 text-bo-neutral-700">{label}</td>
                                <td className="px-3 py-2 text-right text-bo-neutral-900 font-medium">{count}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Individual paths */}
                {paths.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-bo-neutral-700 mb-2">
                      {t('journeyPlanner.paths')}
                    </h5>
                    <div className="space-y-2">
                      {paths.map((path, i) => {
                        let zones: string[] = [];
                        try { zones = JSON.parse(path.zoneSequence); } catch { zones = []; }
                        const originId = journeyData?.originZoneId;
                        return (
                          <div
                            key={path.id}
                            className="flex items-center gap-1 px-3 py-2 bg-bo-neutral-50 rounded-lg text-sm text-bo-neutral-700 flex-wrap"
                          >
                            <span className="text-xs font-medium text-bo-neutral-400 w-6">#{i + 1}</span>
                            {zones.map((z, j) => {
                              const isOrigin = z === originId;
                              const isDest = z === destZoneId;
                              const zMatch = allZones.find((zone) => zone.id === z);
                              const zLabel = zMatch ? zoneName(zMatch) : z;
                              return (
                                <span key={j} className="flex items-center gap-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      isOrigin
                                        ? 'bg-bo-primary-50 text-bo-primary-800'
                                        : isDest
                                          ? 'bg-bo-accent-50 text-bo-accent-700'
                                          : 'bg-bo-neutral-100 text-bo-neutral-600'
                                    }`}
                                  >
                                    {zLabel}
                                  </span>
                                  {j < zones.length - 1 && <ArrowRight className="w-3 h-3 text-bo-neutral-300" />}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedJobId && !journeyData && (
              <p className="text-sm text-bo-neutral-400">{t('videoAnalysis.loadingJourneys')}</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
