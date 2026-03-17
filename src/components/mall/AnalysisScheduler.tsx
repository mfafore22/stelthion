'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Video, Calendar, Clock, Users, Send } from 'lucide-react';
import useSWR, { mutate } from 'swr';

interface Camera {
  id: string;
  label: string;
  floor: string;
}

interface Job {
  id: string;
  mallId: string;
  cameraId: string;
  camera: { label: string; floor: string };
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-bo-warning-light text-bo-warning-dark',
  PROCESSING: 'bg-bo-info-light text-bo-info-dark',
  COMPLETE: 'bg-bo-success-light text-bo-success-dark',
  FAILED: 'bg-bo-error-light text-bo-error-dark',
};

const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
}).filter((t) => t <= '21:00');

const JOURNEY_OPTIONS = [1, 5, 10, 15, 20];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AnalysisScheduler({ mallId }: { mallId: string }) {
  const { t } = useTranslation('mall');
  const { data: cameras = [] } = useSWR<Camera[]>(
    `/api/floorplan/${mallId}/cameras`,
    fetcher,
  );
  const { data: jobs = [] } = useSWR<Job[]>(
    `/api/analysis/jobs?mallId=${mallId}`,
    fetcher,
    { refreshInterval: 15000 },
  );

  const [cameraId, setCameraId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [journeyCount, setJourneyCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cameras.length > 0 && !cameraId) {
      setCameraId(cameras[0].id);
    }
  }, [cameras, cameraId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraId || !date) return;
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
          requestedBy: mallId,
        }),
      });
      mutate(`/api/analysis/jobs?mallId=${mallId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-bo-neutral-200 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Video className="w-5 h-5 text-bo-primary-500" />
        <h3 className="text-lg font-semibold text-bo-neutral-900">{t('videoAnalysis.scheduleTitle')}</h3>
      </div>

      {cameras.length === 0 ? (
        <p className="text-sm text-bo-neutral-500">
          {t('videoAnalysis.noCameras')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Camera selector */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
                <Video className="w-3.5 h-3.5" /> {t('videoAnalysis.camera')}
              </label>
              <select
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.floor})
                  </option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
                <Calendar className="w-3.5 h-3.5" /> {t('videoAnalysis.date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                required
                className="w-full text-sm border border-bo-neutral-200 rounded-lg px-3 py-2"
              />
            </div>

            {/* Time range */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
                <Clock className="w-3.5 h-3.5" /> {t('videoAnalysis.timeRange')}
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 text-sm border border-bo-neutral-200 rounded-lg px-2 py-2"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="text-xs text-bo-neutral-400">-</span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 text-sm border border-bo-neutral-200 rounded-lg px-2 py-2"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Journey count */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-bo-neutral-600 mb-1">
                <Users className="w-3.5 h-3.5" /> {t('videoAnalysis.tagTrack')}
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
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !cameraId || !date}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-bo-primary-500 text-white hover:bg-bo-primary-600 disabled:opacity-40 transition-all duration-300"
          >
            <Send className="w-4 h-4" />
            {submitting ? t('videoAnalysis.submitting') : t('videoAnalysis.scheduleAnalysis')}
          </button>
        </form>
      )}

      {/* Pending / recent jobs */}
      {jobs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-bo-neutral-700 mb-2">{t('videoAnalysis.recentJobs')}</h4>
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between px-3 py-2 bg-bo-neutral-50 rounded-lg text-sm"
              >
                <span className="text-bo-neutral-700">
                  {job.camera.label} &middot; {new Date(job.footageDate).toLocaleDateString()} &middot; {job.startTime}–{job.endTime}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status] ?? ''}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
