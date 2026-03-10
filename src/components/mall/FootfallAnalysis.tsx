/**
 * FootfallAnalysis Component
 * Floor plan heatmap with clickable zones, time slider, and per-zone visitor data.
 * Designed for Ideapark Lempäälä (mallId: 'ideapark').
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  IDEAPARK_ZONES,
  getZoneVisitors,
  getHeatColor,
  type IdeaparkZone,
  type ZoneVisitorData,
} from '@/lib/data/ideaparkZones';

interface FootfallAnalysisProps {
  mallId: string;
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

export function FootfallAnalysis({ mallId }: FootfallAnalysisProps) {
  const now = new Date();
  const [floor, setFloor] = useState<Floor>('ground');
  const [hour, setHour] = useState<number>(now.getHours() >= 10 && now.getHours() <= 21 ? now.getHours() : 14);
  const [playing, setPlaying] = useState(false);
  const [selectedZone, setSelectedZone] = useState<IdeaparkZone | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const getVisitorData = useCallback(
    (zone: IdeaparkZone): ZoneVisitorData => getZoneVisitors(zone, hour, dayOfWeek),
    [hour, dayOfWeek]
  );

  const totalVisitors = IDEAPARK_ZONES.reduce(
    (sum, z) => sum + getVisitorData(z).visitors,
    0
  );

  const dateLabel = now.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <Card className="p-0 overflow-hidden border-bo-neutral-200/40 shadow-bo-glass rounded-xl bg-white">
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bo-neutral-100">
        {/* Floor selector */}
        <div className="flex items-center gap-1 bg-bo-neutral-100 rounded-lg p-1">
          {(['ground', 'upper'] as Floor[]).map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                floor === f
                  ? 'bg-white shadow text-bo-neutral-900'
                  : 'text-bo-neutral-500 hover:text-bo-neutral-700'
              )}
            >
              {f === 'ground' ? 'Ground Floor' : 'Upper Level'}
            </button>
          ))}
        </div>

        {/* Date + live visitor count */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-bo-neutral-500 font-medium">
            {dateLabel} · {HOUR_LABELS[hour]}
          </span>
          <div className="flex items-center gap-1.5 bg-bo-neutral-50 border border-bo-neutral-200 rounded-lg px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-bo-neutral-800">
              {totalVisitors.toLocaleString()} visitors
            </span>
          </div>
        </div>
      </div>

      {/* ── Time slider ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-5 border-b border-bo-neutral-100 bg-bo-neutral-50/50">
        <div className="flex items-center gap-3">
          {/* Play / Pause button */}
          <button
            onClick={() => setPlaying((p) => !p)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded border border-bo-neutral-200 bg-white text-bo-neutral-600 hover:bg-bo-neutral-50 transition-colors"
            aria-label={playing ? 'Pause' : 'Play'}
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
            <div className="relative h-1.5 rounded-full bg-bo-neutral-200 mx-2">
              {/* Filled portion */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-bo-neutral-800 transition-all"
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
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-bo-neutral-900 border-2 border-white shadow pointer-events-none transition-all"
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
                        h <= hour ? 'bg-bo-neutral-700' : 'bg-bo-neutral-300'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[9px] leading-none font-medium tabular-nums',
                        h === hour ? 'text-bo-neutral-900 font-semibold' : 'text-bo-neutral-400'
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
          <span className="shrink-0 text-xs font-semibold text-bo-neutral-700 bg-white border border-bo-neutral-200 rounded px-2 py-0.5 w-14 text-center">
            {HOUR_LABELS[hour]}
          </span>
        </div>
      </div>

      {/* ── Floor plan + SVG overlay ────────────────────────────────────────── */}
      {floor === 'upper' ? (
        <div className="flex items-center justify-center h-80 bg-bo-neutral-50">
          <div className="text-center space-y-2">
            <div className="text-bo-neutral-400 text-sm font-medium">Upper Level floor plan</div>
            <div className="text-bo-neutral-300 text-xs">Coming soon</div>
          </div>
        </div>
      ) : (
        <div className="relative w-full" style={{ paddingBottom: '45%' }}>
          {/* Floor plan image */}
          <Image
            src="/assets/malls/ideapark/floorplan-ground.png"
            alt="Ideapark Lempäälä ground floor plan"
            fill
            className="object-contain p-3"
            priority
          />

          {/* SVG heatmap overlay */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 450"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none' }}
          >
            {IDEAPARK_ZONES.map((zone) => {
              const data = getVisitorData(zone);
              const color = getHeatColor(data.visitors, zone.capacity);
              const isHovered = hoveredZone === zone.id;
              const isSelected = selectedZone?.id === zone.id;

              return (
                <g
                  key={zone.id}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => setSelectedZone(isSelected ? null : zone)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  <polygon
                    points={zone.svgPoints}
                    fill={color}
                    fillOpacity={isSelected ? 0.72 : isHovered ? 0.62 : 0.42}
                    stroke={isSelected ? '#1e293b' : isHovered ? '#475569' : 'white'}
                    strokeWidth={isSelected ? 2 : 1.5}
                    style={{ transition: 'fill-opacity 0.15s, stroke 0.15s' }}
                  />
                  {/* Zone label */}
                  <text
                    x={zone.labelX}
                    y={zone.labelY - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="#1e293b"
                    fillOpacity={0.85}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {zone.name}
                  </text>
                  <text
                    x={zone.labelX}
                    y={zone.labelY + 7}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#1e293b"
                    fillOpacity={0.7}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {data.visitors.toLocaleString()}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Zone popup */}
          {selectedZone && (() => {
            const data = getVisitorData(selectedZone);
            return (
              <div
                className="absolute z-20 bg-white rounded-xl shadow-lg border border-bo-neutral-200 p-4 w-52 pointer-events-none"
                style={{ top: '8px', right: '8px' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-bo-neutral-800">{selectedZone.name}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: selectedZone.category === 'F&B' ? '#fff7ed' : '#f0fdf4',
                      color: selectedZone.category === 'F&B' ? '#c2410c' : '#15803d',
                    }}
                  >
                    {selectedZone.category}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">Visitors</span>
                    <span className="font-semibold text-bo-neutral-900">{data.visitors.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">vs plan</span>
                    <span className={cn('font-semibold', data.delta >= 0 ? 'text-green-600' : 'text-red-500')}>
                      {data.delta >= 0 ? '+' : ''}{data.delta}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">Density</span>
                    <span className="font-semibold text-bo-neutral-900">{data.density} /m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">Area</span>
                    <span className="font-semibold text-bo-neutral-900">{selectedZone.area_sqm.toLocaleString()} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bo-neutral-500">Predicted</span>
                    <span className="font-medium text-bo-neutral-600">{data.predicted.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-bo-neutral-100 bg-bo-neutral-50/50">
        <span className="text-xs text-bo-neutral-400 font-medium shrink-0">Density</span>
        {[
          { color: '#3b82f6', label: 'Quiet' },
          { color: '#22c55e', label: 'Moderate' },
          { color: '#eab308', label: 'Busy' },
          { color: '#f97316', label: 'Very busy' },
          { color: '#ef4444', label: 'Crowded' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color, opacity: 0.72 }} />
            <span className="text-xs text-bo-neutral-500">{label}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-bo-neutral-400">
          Click a zone to see details
        </div>
      </div>
    </Card>
  );
}
