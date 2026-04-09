/**
 * FootfallAnalysis Component
 * Floor plan heatmap with clickable zones, time slider, and per-zone visitor data.
 * Designed for Ideapark Lempäälä (mallId: 'ideapark').
 */

'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getZoneVisitors,
  getHeatColor,
  type IdeaparkZone,
  type ZoneVisitorData,
} from '@/lib/data/ideaparkZones';
import { ZoneStoreList } from './ZoneStoreList';
import { CounterDataPanel } from './CounterDataPanel';
import {
  GROUND_FLOOR_ENTRANCES,
} from '@/lib/data/ideaparkStorePositions';
import { usePublishedFloorplan, type PublishedCamera } from '@/hooks/usePublishedFloorplan';
import { decollidLabels, getPolygonBbox, type LabelInput } from '@/lib/utils/labelDecollision';

/** Counter data types from /api/counters/[mallId] */
interface CounterDailyEntry {
  date: string;
  visitors: number;
  visitorsPrevYear: number | null;
  estimated?: boolean;
  hourlyData?: { hour: number; visitors: number; prevYear: number | null; year2: number | null; year3: number | null }[];
}

interface CounterInfo {
  label: string;
  floor: string;
  granularity: string;
  dailyData: CounterDailyEntry[];
  weekTotal: number;
  weekTotalPrevYear: number | null;
  deltaPercent: number | null;
}

interface CounterApiResponse {
  week: number;
  year: number;
  counters: CounterInfo[];
  availableWeeks: { week: number; year: number }[];
}

/** Data snapshot exposed via ref for report export */
export interface FootfallReportData {
  floor: 'ground' | 'upper';
  hour: number;
  dayOfWeek: number;
  zones: { zone: import('@/lib/data/ideaparkZones').IdeaparkZone; visitors: import('@/lib/data/ideaparkZones').ZoneVisitorData }[];
  floorplanElement: HTMLElement | null;
}

interface FootfallAnalysisProps {
  mallId: string;
  /** When true, cameras and zones become clickable for analysis job selection */
  selectionMode?: boolean;
  selectedCameraIds?: string[];
  selectedZoneIds?: string[];
  onToggleCamera?: (id: string) => void;
  onToggleZone?: (id: string) => void;
  /** Called when the user switches floor */
  onFloorChange?: (floor: 'ground' | 'upper') => void;
  /** Render prop for injecting an SVG overlay (e.g. flow arrows) on top of the floorplan */
  overlayContent?: (floor: 'ground' | 'upper') => React.ReactNode;
  /** Ref that receives current state snapshot for report export */
  reportDataRef?: React.RefObject<FootfallReportData | null>;
  /** Hide the density colour legend at the bottom (e.g. when used inside analysis modes) */
  hideDensityLegend?: boolean;
}

type Floor = 'ground' | 'upper';

const HOUR_LABELS: Record<number, string> = {
  10: '10:00', 11: '11:00', 12: '12:00', 13: '13:00', 14: '14:00',
  15: '15:00', 16: '16:00', 17: '17:00', 18: '18:00', 19: '19:00',
  20: '20:00', 21: '21:00',
};

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const MIN_HOUR = 10;
const MAX_HOUR = 21;


export function FootfallAnalysis({
  mallId,
  selectionMode = false,
  selectedCameraIds = [],
  selectedZoneIds = [],
  onToggleCamera,
  onToggleZone,
  onFloorChange,
  overlayContent,
  reportDataRef,
  hideDensityLegend = false,
}: FootfallAnalysisProps) {
  const { t } = useTranslation('mall');
  const now = new Date();
  const [floor, setFloor] = useState<Floor>('ground');
  const [hour, setHour] = useState<number>(now.getHours() >= 10 && now.getHours() <= 21 ? now.getHours() : 14);
  const [playing, setPlaying] = useState(false);
  const [selectedZone, setSelectedZone] = useState<IdeaparkZone | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Counter data state ────────────────────────────────────────────────
  const [selectedWeek, setSelectedWeek] = useState<{ week: number; year: number } | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<CounterInfo | null>(null);

  // Fetch counter data with SWR (cached across remounts / mode switches)
  const counterSwrKey = selectedWeek
    ? `/api/counters/${mallId}?week=${selectedWeek.week}&year=${selectedWeek.year}`
    : `/api/counters/${mallId}`;
  const { data: counterData } = useSWR<CounterApiResponse>(
    counterSwrKey,
    (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error(`Counter API ${r.status}`); return r.json(); }),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  // Auto-select the first available week once data arrives
  useEffect(() => {
    if (!selectedWeek && counterData?.availableWeeks?.length) {
      setSelectedWeek(counterData.availableWeeks[0]);
    }
  }, [counterData, selectedWeek]);

  // Map counter label → counter info for quick lookup
  const counterByLabel = useMemo(() => {
    if (!counterData?.counters) return new Map<string, CounterInfo>();
    return new Map(counterData.counters.map((c) => [c.label, c]));
  }, [counterData]);

  // ── Zoom & pan state ──────────────────────────────────────────────────
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const clampPan = useCallback((x: number, y: number, z: number) => {
    if (z <= 1) return { x: 0, y: 0 };
    const maxX = ((z - 1) / (2 * z)) * 100;
    const maxY = ((z - 1) / (2 * z)) * 100;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const zoomTo = useCallback((newZoom: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoom(z);
    setPan((p) => clampPan(p.x, p.y, z));
  }, [clampPan]);

  // Reset zoom when floor changes
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [floor]);

  // Wheel / trackpad zoom — non-passive listeners so preventDefault stops page scroll
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = -e.deltaY * 0.005;
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
        setPan((p) => clampPan(p.x, p.y, next));
        return next;
      });
    };

    // Safari trackpad pinch fires gesture events instead of / alongside wheel
    const onGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const ge = e as Event & { scale: number };
      if (e.type === 'gesturechange' && ge.scale != null) {
        setZoom((prev) => {
          const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * ge.scale));
          setPan((p) => clampPan(p.x, p.y, next));
          return next;
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGesture, { passive: false } as EventListenerOptions);
    el.addEventListener('gesturechange', onGesture, { passive: false } as EventListenerOptions);
    el.addEventListener('gestureend', onGesture, { passive: false } as EventListenerOptions);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGesture);
      el.removeEventListener('gesturechange', onGesture);
      el.removeEventListener('gestureend', onGesture);
    };
  }, [clampPan]);

  // Pan via mouse drag (only when zoomed in)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [zoom, pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - panStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - panStart.current.y) / rect.height) * 100;
    setPan(clampPan(panOrigin.current.x + dx, panOrigin.current.y + dy, zoom));
  }, [zoom, clampPan]);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Auto-advance hour when playing
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setHour((h) => {
          if (h >= MAX_HOUR) { setPlaying(false); return h; }
          return h + 1;
        });
      }, 900);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing]);

  const dayOfWeek = now.getDay();

  // Prefer published floorplan data from DB; fall back to static imports
  const published = usePublishedFloorplan(mallId);
  const activeCameras = floor === 'upper' ? published.upperCameras : published.groundCameras;

  const getVisitorData = useCallback(
    (zone: IdeaparkZone): ZoneVisitorData => getZoneVisitors(zone, hour, dayOfWeek),
    [hour, dayOfWeek]
  );

  // Use only published DB data — no static fallback.
  // Show empty floorplan while loading; avoids stale static zones conflicting with live data.
  const hasPublishedGround = published.groundZones !== null;
  const allZones = floor === 'upper'
    ? (published.upperZones ?? [])
    : (published.groundZones ?? []);

  // Filter out store zones — they have capacity 0 and make the heat map look messy
  const activeZones = allZones;

  // De-collide zone/store name labels so they don't overlap
  const viewBox = floor === 'upper' ? { w: 1518, h: 688 } : { w: 1504, h: 704 };
  const decollidedLabels = useMemo(() => {
    if (activeZones.length === 0) return [];
    const allInputs: LabelInput[] = activeZones.map((z) => {
      const bbox = getPolygonBbox(z.svgPoints);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isStore = (z as any).drawShape === 'rect' || (z as any).category === 'Store';
      const fontSize = isStore ? 7 : 13;
      const tw = (z.nameFi ?? z.name).length * fontSize * 0.55;
      return {
        id: z.id,
        anchorX: z.labelX,
        anchorY: z.labelY,
        text: z.nameFi ?? z.name,
        tier: isStore ? 'store' as const : 'zone' as const,
        fontSize,
        fitsInside: tw < bbox.w * 0.85 && fontSize + 4 < bbox.h,
        shapeBounds: { minX: bbox.minX, minY: bbox.minY, w: bbox.w, h: bbox.h },
      };
    });

    // Zoom-dependent visibility: zones always, stores only when zoomed in
    const visibleInputs = allInputs.filter((lbl) => {
      if (lbl.tier === 'zone') return true;
      if (zoom < 1.5) return false;
      // Only show store labels within the visible viewport
      const vpCx = viewBox.w / 2 - (pan.x / 100) * (viewBox.w / 2);
      const vpCy = viewBox.h / 2 - (pan.y / 100) * (viewBox.h / 2);
      const vpHalfW = viewBox.w / (2 * zoom);
      const vpHalfH = viewBox.h / (2 * zoom);
      return lbl.anchorX >= vpCx - vpHalfW && lbl.anchorX <= vpCx + vpHalfW
          && lbl.anchorY >= vpCy - vpHalfH && lbl.anchorY <= vpCy + vpHalfH;
    });

    return decollidLabels(visibleInputs, { viewBoxWidth: viewBox.w, viewBoxHeight: viewBox.h });
  }, [activeZones, floor, viewBox.w, viewBox.h, zoom, pan.x, pan.y]);

  // Sum real counter data for the selected hour when available
  const counterTotalForHour = useMemo(() => {
    if (!counterData?.counters?.length) return null;
    let total = 0;
    for (const counter of counterData.counters) {
      // Find the daily entry matching the current day-of-week
      for (const day of counter.dailyData) {
        const dt = new Date(day.date + 'T00:00:00');
        if (dt.getDay() === dayOfWeek || counter.dailyData.length === 1) {
          if (day.hourlyData?.length) {
            const hEntry = day.hourlyData.find((h) => h.hour === hour);
            if (hEntry) total += hEntry.visitors;
          } else {
            // Distribute daily total by hour curve
            const CURVE = [0,0,0,0,0,0,0,0,0,0,0.08,0.32,0.58,0.74,0.88,0.96,1.00,0.97,0.41,0.30,0.14,0.05,0,0];
            const cSum = CURVE.reduce((a, b) => a + b, 0);
            const fraction = (CURVE[hour] ?? 0) / cSum;
            total += Math.round(day.visitors * fraction);
          }
          break;
        }
      }
    }
    return total;
  }, [counterData, hour, dayOfWeek]);

  const totalVisitors = counterTotalForHour ?? activeZones.reduce(
    (sum, z) => sum + getVisitorData(z).visitors,
    0
  );

  const dateLabel = now.toLocaleDateString('fi-FI', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // Sync current state to reportDataRef for export
  useEffect(() => {
    if (!reportDataRef) return;
    reportDataRef.current = {
      floor,
      hour,
      dayOfWeek,
      zones: activeZones.map((z) => ({ zone: z, visitors: getVisitorData(z) })),
      floorplanElement: mapContainerRef.current,
    };
  }, [reportDataRef, floor, hour, dayOfWeek, activeZones, getVisitorData]);

  return (
    <Card className="p-0 overflow-hidden bg-bo-glass rounded-xl shadow-bo-glass-strong border-2 border-bo-neutral-300/60 backdrop-blur-xl">
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bo-primary-100/60 bg-bo-glass-primary">
        {/* Floor selector */}
        <div className="flex items-center gap-1 bg-bo-primary-50/60 rounded-lg p-1">
          {(['ground', 'upper'] as Floor[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFloor(f); setSelectedZone(null); onFloorChange?.(f); }}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                floor === f
                  ? 'bg-white shadow-sm text-bo-primary-800 ring-1 ring-bo-primary-200/50'
                  : 'text-bo-neutral-500 hover:text-bo-neutral-700'
              )}
            >
              {f === 'ground' ? t('heatmap.groundFloor') : t('heatmap.upperFloor')}
            </button>
          ))}
        </div>

        {/* Week picker + Date + live visitor count */}
        <div className="flex items-center gap-4">
          {/* Counter data week picker */}
          {counterData && counterData.availableWeeks?.length > 0 && (
            <select
              value={selectedWeek ? `${selectedWeek.week}-${selectedWeek.year}` : ''}
              onChange={(e) => {
                const [w, y] = e.target.value.split('-').map(Number);
                setSelectedWeek({ week: w, year: y });
                setSelectedCounter(null);
              }}
              className="text-xs bg-bo-primary-50/60 border border-bo-primary-200/50 rounded-md px-2 py-1 text-bo-primary-800 font-medium"
            >
              {counterData.availableWeeks.map((aw) => (
                <option key={`${aw.week}-${aw.year}`} value={`${aw.week}-${aw.year}`}>
                  vk.{aw.week} / {aw.year}
                </option>
              ))}
            </select>
          )}
          <span className="text-xs text-bo-neutral-500 font-medium">
            {dateLabel} · {HOUR_LABELS[hour]}
          </span>
          <div className="flex items-center gap-1.5 bg-bo-primary-50 border border-bo-primary-200/60 rounded-lg px-3 py-1 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-bo-primary-800">
              {totalVisitors.toLocaleString()} {t('footfall.visitors', 'visitors')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Time slider ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-5 border-b border-bo-primary-100/40 bg-bo-primary-50/30">
        <div className="flex items-center gap-3">
          {/* Play / Pause button */}
          <button
            onClick={() => setPlaying((p) => !p)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-bo-primary-200/60 bg-bo-primary-50 text-bo-primary-700 hover:bg-bo-primary-100 hover:text-bo-primary-800 transition-colors shadow-sm"
            aria-label={playing ? t('footfall.pause', 'Pause') : t('footfall.play', 'Play')}
          >
            {playing ? (
              // Pause icon: two vertical bars
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
                <rect x="1" y="0.5" width="3" height="10" rx="0.5" fill="currentColor"/>
                <rect x="6" y="0.5" width="3" height="10" rx="0.5" fill="currentColor"/>
              </svg>
            ) : (
              // Play icon: triangle
              <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
                <path d="M2 1.5L9 5.5L2 9.5V1.5Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          {/* Custom tick-mark slider */}
          <div className="flex-1 relative" style={{ paddingBottom: '18px' }}>
            {/* Track background */}
            <div className="relative h-1.5 rounded-full bg-bo-primary-100 mx-2">
              {/* Filled portion */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-bo-primary-600 transition-all"
                style={{ width: `${((hour - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * 100}%` }}
              />
              {/* Hidden range input for interaction */}
              <input
                type="range"
                min={MIN_HOUR}
                max={MAX_HOUR}
                step={1}
                value={hour}
                onChange={(e) => {
                  setHour(Number(e.target.value));
                  setSelectedZone(null);
                  setPlaying(false);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: '24px', top: '-6px', margin: 0 }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-bo-primary-700 border-2 border-white shadow-md ring-2 ring-bo-primary-300/40 pointer-events-none transition-all"
                style={{ left: `${((hour - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * 100}%` }}
              />
            </div>

            {/* Tick marks + hour labels */}
            <div className="absolute top-3 left-2 right-2 flex justify-between pointer-events-none">
              {HOURS.map((h) => {
                const pct = ((h - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * 100;
                return (
                  <div
                    key={h}
                    className="absolute flex flex-col items-center gap-0.5"
                    style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className={cn(
                        'w-px h-1.5 rounded-full',
                        h <= hour ? 'bg-bo-primary-600' : 'bg-bo-neutral-300'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[9px] leading-none font-medium tabular-nums',
                        h === hour ? 'text-bo-primary-800 font-semibold' : 'text-bo-neutral-400'
                      )}
                    >
                      {h}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current time badge */}
          <span className="shrink-0 text-xs font-semibold text-bo-primary-800 bg-bo-primary-50/80 border border-bo-primary-200/50 rounded-md px-2 py-0.5 w-14 text-center">
            {HOUR_LABELS[hour]}
          </span>
        </div>
      </div>

      {/* ── Floor plan + SVG overlay ────────────────────────────────────────── */}
      <div
        ref={mapContainerRef}
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: floor === 'upper' ? '45.3%' : '46.8%', cursor: zoom > 1 ? 'grab' : 'default', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Zoom controls */}
        <div className="absolute top-2 left-2 z-30 flex flex-col gap-1">
          <button
            onClick={() => zoomTo(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bo-glass border border-bo-primary-200/40 shadow-bo-glass text-bo-primary-700 hover:bg-bo-primary-50 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm text-base font-semibold"
            aria-label="Zoom in"
          >+</button>
          <button
            onClick={() => zoomTo(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bo-glass border border-bo-primary-200/40 shadow-bo-glass text-bo-primary-700 hover:bg-bo-primary-50 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm text-base font-semibold"
            aria-label="Zoom out"
          >−</button>
          {zoom > 1 && (
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bo-glass border border-bo-primary-200/40 shadow-bo-glass text-bo-primary-700 hover:bg-bo-primary-50 transition-all duration-300 backdrop-blur-sm text-[10px] font-semibold"
              aria-label="Reset zoom"
            >1:1</button>
          )}
        </div>

        <div
          className="absolute inset-0 origin-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`,
            transition: isPanning.current ? 'none' : 'transform 0.25s ease-out',
          }}
        >
          {/* Floor plan image */}
          <Image
            src={floor === 'upper'
              ? '/assets/malls/ideapark/floorplan-upper.png'
              : '/assets/malls/ideapark/floorplan-ground.png'}
            alt={floor === 'upper'
              ? 'Ideapark Lempäälä yläkerran pohjakartta'
              : 'Ideapark Lempäälä pohjakerroksen pohjakartta'}
            fill
            className="object-contain"
            priority
            draggable={false}
          />

          {/* SVG heatmap overlay */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox={floor === 'upper' ? '0 0 1518 688' : '0 0 1504 704'}
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none' }}
          >
            {/* Subtle green wash behind the floor plan */}
            <rect width="100%" height="100%" fill="var(--color-bo-primary-50)" fillOpacity={0.35} />

            {activeZones.map((zone) => {
              const data = getVisitorData(zone);
              const color = getHeatColor(data.visitors, zone.capacity);
              const isHovered = hoveredZone === zone.id;
              const isZoneSelected = selectionMode && selectedZoneIds.includes(zone.id);
              const isStatsSelected = !selectionMode && selectedZone?.id === zone.id;

              return (
                <g
                  key={zone.id}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => {
                    if (selectionMode && onToggleZone) {
                      onToggleZone(zone.id);
                    } else {
                      setSelectedZone(isStatsSelected ? null : zone);
                    }
                  }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  <polygon
                    points={zone.svgPoints}
                    fill={color}
                    fillOpacity={isZoneSelected ? 0.65 : isStatsSelected ? 0.78 : isHovered ? 0.68 : 0.48}
                    stroke={
                      isZoneSelected ? 'var(--color-bo-primary-600)'
                      : isStatsSelected ? 'var(--color-bo-primary-800)'
                      : isHovered ? 'var(--color-bo-primary-700)'
                      : 'rgba(255,255,255,0.6)'
                    }
                    strokeWidth={isZoneSelected ? 2.5 : isStatsSelected ? 2.5 : isHovered ? 2 : 1}
                    style={{ transition: 'fill-opacity 0.15s, stroke 0.15s' }}
                  />
                  {/* Selection checkmark overlay */}
                  {isZoneSelected && (
                    <g transform={`translate(${zone.labelX - 8}, ${zone.labelY - 8})`} style={{ pointerEvents: 'none' }}>
                      <circle cx="8" cy="8" r="10" fill="rgba(50,141,46,0.85)" />
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* ── De-collided zone & store name labels ────────────────────── */}
            {decollidedLabels.map((lbl) => {
              const zone = activeZones.find((z) => z.id === lbl.id);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const isStore = (zone as any)?.drawShape === 'rect' || (zone as any)?.category === 'Store';
              return (
                <g key={`lbl-${lbl.id}`} style={{ pointerEvents: 'none', transition: 'opacity 0.15s ease' }} opacity={
                  (hoveredZone === lbl.id || selectedZone?.id === lbl.id)
                    ? 1
                    : zoom >= 2.5
                      ? Math.min(1, (zoom - 2.3) / 0.4)
                      : 0
                }>
                  {/* Leader line from displaced label to anchor */}
                  {lbl.displaced && (
                    lbl.leaderWaypoint ? (
                      <polyline
                        points={`${lbl.x + lbl.w / 2},${lbl.y + lbl.h / 2} ${lbl.leaderWaypoint[0]},${lbl.leaderWaypoint[1]} ${lbl.anchorX},${lbl.anchorY}`}
                        stroke="var(--color-bo-neutral-400)" strokeWidth={0.5} fill="none" strokeDasharray="2,2" />
                    ) : (
                      <line
                        x1={lbl.x + lbl.w / 2} y1={lbl.y + lbl.h / 2}
                        x2={lbl.anchorX} y2={lbl.anchorY}
                        stroke="var(--color-bo-neutral-400)" strokeWidth={0.5} strokeDasharray="2,2" />
                    )
                  )}
                  {/* Pill background */}
                  <rect
                    x={lbl.x} y={lbl.y}
                    width={lbl.w} height={lbl.h}
                    rx={lbl.h / 2}
                    fill={isStore ? 'rgba(255,255,255,0.85)' : 'rgba(50,141,46,0.12)'}
                    stroke={isStore ? 'rgba(0,0,0,0.08)' : 'rgba(50,141,46,0.25)'}
                    strokeWidth={0.5}
                  />
                  {/* Label text */}
                  <text
                    x={lbl.x + lbl.w / 2} y={lbl.y + lbl.h / 2 + (isStore ? 3 : 4.5)}
                    textAnchor="middle"
                    fontSize={isStore ? 7 : 13}
                    fontWeight={isStore ? 500 : 600}
                    fill={isStore ? 'var(--color-bo-neutral-700)' : 'var(--color-bo-primary-800)'}
                    fillOpacity={isStore ? 0.8 : 0.95}
                    style={{ userSelect: 'none' }}
                  >
                    {lbl.displayText}
                  </text>
                </g>
              );
            })}

            {/* ── Zone-level buttons: Tapahtumatori + Ravintolamaailma (static only) */}
            {floor === 'ground' && !hasPublishedGround && (() => {
              const zoneBtns = [
                { zoneId: 'center-hub', cx: 640, cy: 415, label: t('footfall.zones.centerHub', 'Tapahtumatori') },
                { zoneId: 'food-court', cx: 360, cy: 430, label: t('footfall.zones.foodCourt', 'Ravintolamaailma') },
              ];
              return zoneBtns.map(({ zoneId, cx, cy, label }) => {
                const zone = activeZones.find((z) => z.id === zoneId);
                const isHov = hoveredZone === `btn-${zoneId}`;
                const color = zone ? getHeatColor(getVisitorData(zone).visitors, zone.capacity) : '#64748b';
                return (
                  <g key={`btn-${zoneId}`}
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    onClick={() => { if (zone) setSelectedZone(selectedZone?.id === zone.id ? null : zone); }}
                    onMouseEnter={() => setHoveredZone(`btn-${zoneId}`)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    <circle cx={cx} cy={cy} r={isHov ? 10 : 8}
                      fill={color} fillOpacity={isHov ? 0.95 : 0.8}
                      stroke="white" strokeWidth={2}
                      style={{ transition: 'r 0.1s' }} />
                    <circle cx={cx} cy={cy} r={3} fill="white" fillOpacity={0.95}
                      style={{ pointerEvents: 'none' }} />
                    <text x={cx} y={cy + 16} textAnchor="middle"
                      fontSize="8" fontWeight="600"
                      fill="#1e293b" fillOpacity={0.85}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {label}
                    </text>
                  </g>
                );
              });
            })()}

            {/* ── Entrance pins (ground floor only, hidden when published data exists) */}
            {floor === 'ground' && !hasPublishedGround && GROUND_FLOOR_ENTRANCES.map((e) => (
              <g key={e.id} style={{ pointerEvents: 'none' }}>
                <circle cx={e.x} cy={e.y} r={6}
                  fill="var(--color-bo-accent-600)" fillOpacity={0.9} stroke="white" strokeWidth={1.5} />
                {/* Up-arrow indicator */}
                <polygon
                  points={`${e.x},${e.y - 4} ${e.x - 3},${e.y + 2} ${e.x + 3},${e.y + 2}`}
                  fill="white" fillOpacity={0.95} />
                <text x={e.x} y={e.y + 17} textAnchor="middle"
                  fontSize="7.5" fontWeight="600" fill="var(--color-bo-accent-600)" fillOpacity={0.95}
                  style={{ userSelect: 'none' }}>
                  {e.labelFi}
                </text>
              </g>
            ))}

            {/* ── Camera pins ──────────────────────────────────────────────── */}
            {activeCameras.map((cam) => {
              const isCamSelected = selectionMode && selectedCameraIds.includes(cam.id);
              const camSelIndex = selectedCameraIds.indexOf(cam.id);
              const isCounter = (cam.deviceType ?? 'camera') === 'counter';
              const counterInfo = isCounter ? counterByLabel.get(cam.label) : undefined;
              const isCounterSelected = selectedCounter?.label === cam.label;
              const pinColor = isCounter
                ? 'var(--color-bo-primary-600, #328d2e)'
                : 'var(--color-bo-accent-600, #3b82f6)';
              const labelColor = isCounter
                ? 'var(--color-bo-primary-700, #266b23)'
                : 'var(--color-bo-accent-700, #2563eb)';
              const counterClickable = isCounter && counterData;
              return (
                <g
                  key={cam.id}
                  style={{ pointerEvents: selectionMode || counterClickable ? 'all' : 'none', cursor: selectionMode || counterClickable ? 'pointer' : 'default' }}
                  onClick={
                    counterClickable
                      ? () => setSelectedCounter(isCounterSelected ? null : (counterInfo ?? null))
                      : selectionMode && onToggleCamera
                        ? () => onToggleCamera(cam.id)
                        : undefined
                  }
                >
                  {/* Pulsing ring when selected in selection mode */}
                  {isCamSelected && (
                    <circle cx={cam.x} cy={cam.y} r="14" fill="none"
                      stroke={pinColor} strokeWidth="1.5" strokeOpacity={0.5}>
                      <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Pin body — rounded square for counters, circle for cameras */}
                  {isCounter ? (
                    <rect
                      x={cam.x - (isCamSelected ? 8 : 5)}
                      y={cam.y - (isCamSelected ? 8 : 5)}
                      width={(isCamSelected ? 8 : 5) * 2}
                      height={(isCamSelected ? 8 : 5) * 2}
                      rx={2}
                      fill={pinColor}
                      fillOpacity={isCamSelected ? 1 : 0.9}
                      stroke="white" strokeWidth={isCamSelected ? 2.5 : 1.5}
                      className="transition-all duration-200" />
                  ) : (
                    <circle cx={cam.x} cy={cam.y} r={isCamSelected ? 8 : 5}
                      fill={pinColor}
                      fillOpacity={isCamSelected ? 1 : 0.9}
                      stroke="white" strokeWidth={isCamSelected ? 2.5 : 1.5}
                      className="transition-all duration-200" />
                  )}
                  {/* Index badge when selected */}
                  {isCamSelected && camSelIndex >= 0 ? (
                    <text x={cam.x} y={cam.y + 4} textAnchor="middle"
                      fontSize="9" fontWeight="700" fill="white"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {String.fromCharCode(65 + camSelIndex)}
                    </text>
                  ) : (
                    isCounter ? (
                      <text x={cam.x} y={cam.y + 3} textAnchor="middle"
                        fontSize="7" fontWeight="700" fill="white"
                        style={{ pointerEvents: 'none' }}>V</text>
                    ) : (
                      <circle cx={cam.x} cy={cam.y} r={2} fill="white" fillOpacity={0.9}
                        style={{ pointerEvents: 'none' }} />
                    )
                  )}
                  {/* Highlight ring for selected counter */}
                  {isCounterSelected && (
                    <circle cx={cam.x} cy={cam.y} r="14" fill="none"
                      stroke={pinColor} strokeWidth="1.5" strokeOpacity={0.5}>
                      <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Label */}
                  <text x={cam.x} y={cam.y + (isCamSelected ? 18 : 14)} textAnchor="middle"
                    fontSize={isCamSelected ? '8' : '6.5'} fontWeight="600"
                    fill={labelColor} fillOpacity={0.85}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {cam.label}
                  </text>
                  {/* Counter weekly total badge */}
                  {isCounter && counterInfo && (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect
                        x={cam.x - 18} y={cam.y + (isCamSelected ? 20 : 16)}
                        width={36} height={11} rx={5.5}
                        fill="var(--color-bo-neutral-950)" fillOpacity={0.75}
                      />
                      <text x={cam.x} y={cam.y + (isCamSelected ? 28 : 24)} textAnchor="middle"
                        fontSize="7" fontWeight="600" fill="white"
                        style={{ userSelect: 'none' }}>
                        {counterInfo.weekTotal.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* ── Connection line between 2 selected cameras (selection mode) ── */}
            {selectionMode && (() => {
              const selectedOnFloor = activeCameras.filter((c) => selectedCameraIds.includes(c.id));
              if (selectedOnFloor.length !== 2) return null;
              return (
                <line
                  x1={selectedOnFloor[0].x} y1={selectedOnFloor[0].y}
                  x2={selectedOnFloor[1].x} y2={selectedOnFloor[1].y}
                  stroke="var(--color-bo-accent-600, #214990)"
                  strokeWidth="2" strokeDasharray="6 4" strokeOpacity={0.7}
                  style={{ pointerEvents: 'none' }}>
                  <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.5s" repeatCount="indefinite" />
                </line>
              );
            })()}

            {/* ── Hovered zone tooltip (zoom-compensated) ─────────────────── */}
            {hoveredZone && !hoveredZone.startsWith('btn-') && (() => {
              const zone = activeZones.find((z) => z.id === hoveredZone);
              if (!zone) return null;
              const data = getVisitorData(zone);
              const label = `${zone.nameFi} · ${data.visitors.toLocaleString()}`;
              const s = 1 / zoom; // inverse scale so tooltip stays readable at any zoom
              const fs = 22;
              const tw = Math.max(label.length * fs * 0.58, 140);
              const pillH = 34;
              return (
                <g style={{ pointerEvents: 'none' }}
                  transform={`translate(${zone.labelX}, ${zone.labelY - 30}) scale(${s}) translate(${-zone.labelX}, ${-(zone.labelY - 30)})`}>
                  <rect x={zone.labelX - tw / 2 - 10} y={zone.labelY - 30 - pillH / 2}
                    width={tw + 20} height={pillH} rx={8}
                    fill="var(--color-bo-neutral-950)" fillOpacity={0.88} />
                  <text x={zone.labelX} y={zone.labelY - 30 + 8} textAnchor="middle"
                    fontSize={fs} fontWeight="600" fill="white">
                    {label}
                  </text>
                </g>
              );
            })()}

          </svg>

          {/* External overlay (e.g. flow arrows) */}
          {overlayContent?.(floor)}

        </div>{/* end zoom transform wrapper */}

          {/* Zone popup (hidden in selection mode) */}
          {!selectionMode && selectedZone && (() => {
            const data = getVisitorData(selectedZone);
            return (
              <div
                className="absolute z-20 bg-bo-glass rounded-xl shadow-bo-glass-strong border-2 border-bo-neutral-300/60 backdrop-blur-xl p-4 w-52"
                style={{ top: '8px', right: '8px' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-bo-primary-800">{selectedZone.nameFi}</span>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="text-bo-neutral-300 hover:text-bo-neutral-500 transition-colors ml-2 shrink-0"
                    aria-label="Sulje"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                      <path d="M1 1l10 10M11 1L1 11" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">{t('footfall.visitors', 'Visitors')}</span>
                    <span className="font-semibold text-bo-neutral-900">{data.visitors.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">{t('heatmap.vsPlan')}</span>
                    <span className={cn('font-semibold', data.delta >= 0 ? 'text-green-600' : 'text-red-500')}>
                      {data.delta >= 0 ? '+' : ''}{data.delta}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">{t('heatmap.density')}</span>
                    <span className="font-semibold text-bo-neutral-900">{data.density} /m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">{t('heatmap.area')}</span>
                    <span className="font-semibold text-bo-neutral-900">{selectedZone.area_sqm.toLocaleString('fi-FI')} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">{t('heatmap.forecast')}</span>
                    <span className="font-medium text-bo-neutral-600">{data.predicted.toLocaleString('fi-FI')}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      {/* ── Counter data panel (hidden in selection mode) ────────────────── */}
      {!selectionMode && selectedCounter && (
        <CounterDataPanel
          counter={selectedCounter}
          week={selectedWeek?.week ?? 0}
          year={selectedWeek?.year ?? 0}
          mallId={mallId}
          onClose={() => setSelectedCounter(null)}
        />
      )}

      {/* ── Zone store list (hidden in selection mode) ───────────────────── */}
      {!selectionMode && selectedZone && (
        <ZoneStoreList
          zoneId={selectedZone.id}
          zoneName={selectedZone.nameFi}
          onClose={() => setSelectedZone(null)}
        />
      )}

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      {!hideDensityLegend && (
        <div className="flex items-center gap-4 px-4 py-3 border-t border-bo-primary-100/40 bg-bo-glass-primary">
          <span className="text-xs text-bo-neutral-400 font-medium shrink-0">{t('heatmap.density')}</span>
          {[
            { color: '#A8D9A4', label: t('heatmap.quiet') },
            { color: '#4AA844', label: t('heatmap.moderate') },
            { color: '#E8B931', label: t('heatmap.busy') },
            { color: '#E87B3A', label: t('heatmap.veryBusy') },
            { color: '#D94E53', label: t('heatmap.full') },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color, opacity: 0.72 }} />
              <span className="text-xs text-bo-neutral-500">{label}</span>
            </div>
          ))}
          <div className="ml-auto text-xs text-bo-neutral-400">
            {selectionMode
              ? t('videoAnalysis.unified.mapHint')
              : selectedZone ? null : t('heatmap.clickZoneToSeeStores')}
          </div>
        </div>
      )}
    </Card>
  );
}
