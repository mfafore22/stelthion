'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan } from 'lucide-react';
import { FootfallAnalysis } from '../FootfallAnalysis';
import { SelectionSummary } from './SelectionSummary';
import { VideoAnalysisConfig } from './VideoAnalysisConfig';
import { ZoneCountResult } from './ZoneCountResult';
import { TrackingResult } from './TrackingResult';
import { JourneyMapResult } from './JourneyMapResult';
import { JobHistory } from './JobHistory';
import { inferMode } from './types';
import type {
  AnalysisMode, AnalysisJob, Camera, Zone,
  JobWithResults, JourneyResponse,
} from './types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VideoAnalysisProps {
  mallId: string;
}

export function VideoAnalysis({ mallId }: VideoAnalysisProps) {
  const { t } = useTranslation('mall');

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────
  const { data: cameras = [] } = useSWR<Camera[]>(
    `/api/floorplan/${mallId}/cameras`,
    fetcher,
  );

  const { data: zonesData } = useSWR<{ groundZones: Zone[]; upperZones: Zone[] }>(
    `/api/floorplan/${mallId}/zones`,
    fetcher,
  );
  const zones = useMemo(() => [
    ...(zonesData?.groundZones ?? []),
    ...(zonesData?.upperZones ?? []),
  ], [zonesData]);

  const jobsKey = `/api/analysis/jobs?mallId=${mallId}`;
  const { data: jobs = [] } = useSWR<AnalysisJob[]>(jobsKey, fetcher, { refreshInterval: 15000 });

  const { data: jobResults } = useSWR<JobWithResults>(
    selectedJobId ? `/api/analysis/results/${selectedJobId}` : null,
    fetcher,
  );
  const { data: journeyData } = useSWR<JourneyResponse>(
    selectedJobId ? `/api/analysis/journeys/${selectedJobId}` : null,
    fetcher,
  );

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  // ── Auto-detect mode from selection ────────────────────────────────────
  const detectedMode = useMemo(
    () => inferMode({ cameraIds: selectedCameraIds, zoneIds: selectedZoneIds }),
    [selectedCameraIds, selectedZoneIds],
  );

  // ── Selection handlers ─────────────────────────────────────────────────
  const handleToggleCamera = useCallback((id: string) => {
    setSelectedCameraIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      // Max 2 cameras for AB tracking; if already 2, replace the last one
      if (prev.length >= 2) return [prev[0], id];
      return [...prev, id];
    });
  }, []);

  const handleToggleZone = useCallback((id: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id],
    );
  }, []);

  const handleDeselectCamera = useCallback((id: string) => {
    setSelectedCameraIds((prev) => prev.filter((c) => c !== id));
  }, []);

  const handleDeselectZone = useCallback((id: string) => {
    setSelectedZoneIds((prev) => prev.filter((z) => z !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedCameraIds([]);
    setSelectedZoneIds([]);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (form: {
    date: string;
    startTime: string;
    endTime: string;
    journeyCount: number;
  }) => {
    if (!detectedMode) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        mallId,
        mode: detectedMode,
        footageDate: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        journeyCount: form.journeyCount,
        requestedBy: mallId,
      };

      if (detectedMode === 'ZONE_COUNT') {
        payload.cameraId = selectedCameraIds[0];
      } else if (detectedMode === 'AB_TRACKING') {
        payload.cameraId = selectedCameraIds[0];
        payload.secondaryCameraId = selectedCameraIds[1];
      } else if (detectedMode === 'JOURNEY_MAP') {
        payload.selectedZoneIds = selectedZoneIds;
        if (selectedCameraIds.length > 0) {
          payload.cameraId = selectedCameraIds[0];
          if (selectedCameraIds.length > 1) {
            payload.secondaryCameraId = selectedCameraIds[1];
          }
        }
      }

      await fetch('/api/analysis/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      mutate(jobsKey);
    } finally {
      setSubmitting(false);
    }
  }, [mallId, detectedMode, selectedCameraIds, selectedZoneIds, jobsKey]);

  // ── Job selection ──────────────────────────────────────────────────────
  const handleSelectJob = useCallback((jobId: string | null) => {
    setSelectedJobId(jobId);
  }, []);

  const showResults = selectedJobId && selectedJob?.status === 'COMPLETE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-bo-primary-50 to-bo-primary-100 border border-bo-primary-200/40">
          <Scan className="w-4.5 h-4.5 text-bo-primary-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-bo-neutral-900">
            {t('videoAnalysis.unified.title')}
          </h3>
          <p className="text-[11px] text-bo-neutral-500">
            {t('videoAnalysis.unified.subtitle')}
          </p>
        </div>
      </div>

      {/* Heatmap Floor Plan with selection mode */}
      <FootfallAnalysis
        mallId={mallId}
        selectionMode
        selectedCameraIds={selectedCameraIds}
        selectedZoneIds={selectedZoneIds}
        onToggleCamera={handleToggleCamera}
        onToggleZone={handleToggleZone}
      />

      {/* Selection Summary + Controls */}
      <div>
        <SelectionSummary
          cameras={cameras}
          zones={zones}
          selectedCameraIds={selectedCameraIds}
          selectedZoneIds={selectedZoneIds}
          detectedMode={detectedMode}
          onDeselectCamera={handleDeselectCamera}
          onDeselectZone={handleDeselectZone}
          onClearAll={handleClearAll}
        />

        {/* Config + Submit — only show when something is selected */}
        <AnimatePresence>
          {detectedMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <VideoAnalysisConfig
                mode={detectedMode}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {showResults && (
          <motion.div
            key={selectedJobId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-bo-neutral-200 shadow-bo-sm p-6">
              {selectedJob?.mode === 'ZONE_COUNT' && jobResults && (
                <ZoneCountResult job={jobResults} />
              )}

              {selectedJob?.mode === 'AB_TRACKING' && journeyData?.sessions?.[0] && (
                <TrackingResult
                  session={journeyData.sessions[0]}
                  cameraALabel={selectedJob.camera?.label ?? 'Camera A'}
                  cameraBLabel={selectedJob.secondaryCamera?.label ?? 'Camera B'}
                />
              )}

              {selectedJob?.mode === 'JOURNEY_MAP' && journeyData?.sessions?.[0] && (
                <JourneyMapResult
                  session={journeyData.sessions[0]}
                  selectedZoneIds={
                    selectedJob.selectedZoneIds
                      ? JSON.parse(selectedJob.selectedZoneIds)
                      : []
                  }
                  zones={zones}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job History */}
      <div className="bg-white rounded-xl border border-bo-neutral-200 shadow-bo-sm p-6">
        <JobHistory
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelectJob={handleSelectJob}
        />
      </div>
    </div>
  );
}
