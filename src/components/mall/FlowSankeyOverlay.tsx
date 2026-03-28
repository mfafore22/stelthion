/**
 * FlowSankeyOverlay — SVG bezier arrows on the floorplan showing visitor flow.
 * Draws animated curves from origin to destinations (or sources to origin for inbound).
 * Includes an animated pulse at the origin zone.
 */

'use client';

import React from 'react';
import { IDEAPARK_ZONES, IDEAPARK_UPPER_ZONES, type IdeaparkZone } from '@/lib/data/ideaparkZones';
import type { FlowQueryResponse } from '@/lib/types/flowQuery';

interface FlowSankeyOverlayProps {
  data: FlowQueryResponse;
  floor: 'ground' | 'upper';
}

const ALL_ZONES: IdeaparkZone[] = [...IDEAPARK_ZONES, ...IDEAPARK_UPPER_ZONES];
const GROUND_IDS = new Set(IDEAPARK_ZONES.map((z) => z.id));
const UPPER_IDS = new Set(IDEAPARK_UPPER_ZONES.map((z) => z.id));

function findZone(id: string): IdeaparkZone | undefined {
  return ALL_ZONES.find((z) => z.id === id);
}

/**
 * Calculate a bezier curve between two zone label centres.
 * Uses a vertical offset to create a nice arc.
 */
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Control point offset perpendicular to the line
  const offset = Math.min(dist * 0.3, 80);
  // Midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // Normal vector (perpendicular)
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function FlowSankeyOverlay({ data, floor }: FlowSankeyOverlayProps) {
  const viewBox = floor === 'upper' ? '0 0 1518 688' : '0 0 1504 704';
  const floorZoneIds = floor === 'upper' ? UPPER_IDS : GROUND_IDS;

  // Filter edges to only those visible on the current floor
  const visibleEdges = data.edges.filter((edge) => {
    const fromOnFloor = floorZoneIds.has(edge.from);
    const toOnFloor = floorZoneIds.has(edge.to);
    return fromOnFloor || toOnFloor;
  });

  if (visibleEdges.length === 0) return null;

  const maxVisitors = Math.max(...visibleEdges.map((e) => e.visitors), 1);
  const originZone = findZone(data.origin);
  const originOnFloor = originZone && floorZoneIds.has(data.origin);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Arrowhead marker */}
        <marker
          id="flow-arrow"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#1e293b" fillOpacity="0.6" />
        </marker>

        {/* Animated dash for flow direction */}
        <style>{`
          @keyframes flowDash {
            to { stroke-dashoffset: -20; }
          }
          .flow-line {
            animation: flowDash 1.5s linear infinite;
          }
          @keyframes originPulse {
            0%, 100% { r: 12; opacity: 0.6; }
            50% { r: 22; opacity: 0.15; }
          }
          .origin-pulse {
            animation: originPulse 2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Origin pulse */}
      {originOnFloor && originZone && (
        <>
          <circle
            cx={originZone.labelX}
            cy={originZone.labelY}
            r={12}
            fill="#1e293b"
            className="origin-pulse"
          />
          <circle
            cx={originZone.labelX}
            cy={originZone.labelY}
            r={8}
            fill="#1e293b"
            fillOpacity={0.7}
          />
        </>
      )}

      {/* Flow curves */}
      {visibleEdges.map((edge, i) => {
        const fromZone = findZone(edge.from);
        const toZone = findZone(edge.to);
        if (!fromZone || !toZone) return null;

        // If a zone is on another floor, anchor to the escalator zone
        const fromX = floorZoneIds.has(edge.from) ? fromZone.labelX : (floor === 'upper' ? 760 : 652);
        const fromY = floorZoneIds.has(edge.from) ? fromZone.labelY : (floor === 'upper' ? 382 : 255);
        const toX = floorZoneIds.has(edge.to) ? toZone.labelX : (floor === 'upper' ? 760 : 652);
        const toY = floorZoneIds.has(edge.to) ? toZone.labelY : (floor === 'upper' ? 382 : 255);

        const strokeWidth = Math.max(1.5, (edge.visitors / maxVisitors) * 5);
        const opacity = 0.3 + (edge.visitors / maxVisitors) * 0.4;

        return (
          <path
            key={`${edge.from}-${edge.to}-${i}`}
            d={bezierPath(fromX, fromY, toX, toY)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeOpacity={opacity}
            strokeDasharray="8 12"
            className="flow-line"
            markerEnd="url(#flow-arrow)"
          />
        );
      })}
    </svg>
  );
}
