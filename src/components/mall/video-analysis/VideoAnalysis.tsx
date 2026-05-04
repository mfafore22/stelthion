'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FootfallAnalysis } from '../FootfallAnalysis';
import { SelectionSummary } from './SelectionSummary';
import { VideoAnalysisConfig } from './VideoAnalysisConfig';
import { ZoneCountResult } from './ZoneCountResult';
import { TrackingResult } from './TrackingResult';
import { JourneyMapResult } from './JourneyMapResult';
import { JobHistory } from './JobHistory';
import { FlowQuerySidebar } from '../FlowQuerySidebar';
import { FlowSankeyOverlay } from '../FlowSankeyOverlay';
import { MODE_META } from './constants';
import { inferMode } from './types';
import type {
  AnalysisMode, AnalysisJob, Camera, Zone,
  JobWithResults, JourneyResponse,
} from './types';
import type { FlowQueryResponse } from '@/lib/types/flowQuery';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

interface VideoAnalysisProps {
  mallId: string;
}

export function VideoAnalysis({ mallId }: VideoAnalysisProps) {
  const { t } = useTranslation('mall');

  // ── Mode bar state ────────────────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<AnalysisMode | null>(null);

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // ── Flow query state ─────────────────────────────────────────────────
  const [flowOrigin, setFlowOrigin] = useState<string | null>(null);
  const [flowDestination, setFlowDestination] = useState<string | null>(null);
  const [flowResult, setFlowResult] = useState<FlowQueryResponse | null>(null);

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
    () => inferMode({ cameraIds: selectedCameraIds, zoneIds: selectedZoneIds }, activeMode),
    [selectedCameraIds, selectedZoneIds, activeMode],
  );

  const isFlowQueryMode = activeMode === 'FLOW_QUERY';

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

  // ── Mode switching ──────────────────────────────────────────────────
  const handleModeSwitch = useCallback((mode: AnalysisMode | null) => {
    setActiveMode(mode);
    // Clear all selections when switching modes
    setSelectedCameraIds([]);
    setSelectedZoneIds([]);
    setSelectedJobId(null);
    setFlowOrigin(null);
    setFlowDestination(null);
    setFlowResult(null);
  }, []);

  // ── Flow query zone click handler ────────────────────────────────────
  const handleFlowZoneToggle = useCallback((id: string) => {
    if (id === flowOrigin) {
      // Deselect origin
      setFlowOrigin(null);
      setFlowDestination(null);
      setFlowResult(null);
    } else if (id === flowDestination) {
      // Deselect destination
      setFlowDestination(null);
      setFlowResult(null);
    } else if (!flowOrigin) {
      // Set origin (first click)
      setFlowOrigin(id);
      setFlowResult(null);
    } else {
      // Set destination (second click)
      setFlowDestination(id);
      setFlowResult(null);
    }
  }, [flowOrigin, flowDestination]);

  // Render prop for Sankey overlay on floorplan
  const renderFlowOverlay = useCallback((floor: 'ground' | 'upper') => {
    if (!flowResult) return null;
    return <FlowSankeyOverlay data={flowResult} floor={floor} />;
  }, [flowResult]);

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

  // Mode bar items — 3 user-facing modes (AB_TRACKING merged into FLOW_QUERY)
  const MODE_BAR: { mode: AnalysisMode; labelKey: string }[] = [
    { mode: 'ZONE_COUNT', labelKey: 'videoAnalysis.modes.zoneCount' },
    { mode: 'JOURNEY_MAP', labelKey: 'videoAnalysis.modes.journeyMap' },
    { mode: 'FLOW_QUERY', labelKey: 'videoAnalysis.modes.flowQuery' },
  ];

  // For flow query mode: sync selectedZoneIds with flowOrigin/flowDestination
  // so FootfallAnalysis highlights the right zones
  const flowSelectedZoneIds = useMemo(() => {
    const ids: string[] = [];
    if (flowOrigin) ids.push(flowOrigin);
    if (flowDestination) ids.push(flowDestination);
    return ids;
  }, [flowOrigin, flowDestination]);

  return (
    <div className="bo-surface bo-surface-hover space-y-5 rounded-2xl border-2 border-bo-primary-200/60 p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-bo-primary-200/50 bg-bo-primary-100/70 shadow-bo-sm">
          <Scan className="w-4.5 h-4.5 text-bo-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-bo-neutral-950">
            {t('videoAnalysis.unified.title')}
          </h3>
          <p className="mt-1 text-sm text-bo-neutral-600">
            {t('videoAnalysis.unified.subtitle')}
          </p>
        </div>
      </div>

      {/* Mode bar */}
      <div className="flex w-fit items-center gap-1 rounded-xl border-2 border-bo-neutral-200/70 bg-white/75 p-1 shadow-bo-glass backdrop-blur-xl">
        {MODE_BAR.map(({ mode, labelKey }) => {
          const meta = MODE_META[mode];
          const Icon = meta.icon;
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => handleModeSwitch(isActive ? null : mode)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ease-bo-out-expo',
                isActive
                  ? 'bg-bo-neutral-950 text-white shadow-lg shadow-bo-neutral-900/15 -translate-y-0.5'
                  : 'text-bo-neutral-600 hover:bg-white/70 hover:text-bo-neutral-950'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(labelKey, mode)}
            </button>
          );
        })}
      </div>

      {/* Active mode description */}
      {activeMode && (
        <div className="flex items-start gap-2 rounded-xl border border-bo-neutral-200/60 bg-white/70 px-4 py-3 shadow-bo-glass backdrop-blur-xl">
          <p className="text-xs text-bo-neutral-600 leading-relaxed">
            {t(`videoAnalysis.modesDescription.${activeMode === 'ZONE_COUNT' ? 'zoneCount' : activeMode === 'JOURNEY_MAP' ? 'journeyMap' : 'flowQuery'}`)}
          </p>
        </div>
      )}

      {/* Flow Query mode: sidebar + floorplan grid */}
      {isFlowQueryMode ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {/* Left sidebar */}
          <div>
            <div className="bo-surface-subtle bo-surface-hover rounded-xl border-2 border-bo-neutral-200/60 p-4 shadow-bo-glass">
              <FlowQuerySidebar
                mallId={mallId}
                origin={flowOrigin}
                destination={flowDestination}
                onOriginChange={(id) => { setFlowOrigin(id); setFlowDestination(null); setFlowResult(null); }}
                onDestinationChange={(id) => { setFlowDestination(id); setFlowResult(null); }}
                zones={zones}
              />
            </div>
          </div>

          {/* Right: floorplan with Sankey overlay */}
          <div className="xl:col-span-2">
            <FootfallAnalysis
              mallId={mallId}
              selectionMode
              selectedCameraIds={[]}
              selectedZoneIds={flowSelectedZoneIds}
              onToggleCamera={() => {}}
              onToggleZone={handleFlowZoneToggle}
              overlayContent={renderFlowOverlay}
              hideDensityLegend
            />
          </div>
        </div>
      ) : (
        <>
          {/* Standard modes: full-width floorplan */}
          <FootfallAnalysis
            mallId={mallId}
            selectionMode
            selectedCameraIds={selectedCameraIds}
            selectedZoneIds={selectedZoneIds}
            onToggleCamera={handleToggleCamera}
            onToggleZone={handleToggleZone}
            hideDensityLegend={activeMode === 'JOURNEY_MAP'}
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
                <div className="bo-surface-subtle bo-surface-hover rounded-xl border-2 border-bo-neutral-200/60 p-6 shadow-bo-glass">
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
          <div className="bo-surface-subtle bo-surface-hover rounded-xl border-2 border-bo-neutral-200/60 p-6 shadow-bo-glass">
            <JobHistory
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
            />
          </div>
        </>
      )}
    </div>
  );
}
