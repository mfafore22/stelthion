'use client';

import { useTranslation } from 'react-i18next';
import { MallCard } from '@/components/mall/ui/MallCard';
import { cn } from '@/lib/utils';
import type {
  SpaceSuggestion,
  SpaceSuggestionAction,
} from '@/lib/space-optimizer/types';

interface FloorplanHighlightProps {
  suggestions: SpaceSuggestion[];
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  className?: string;
}

const ACTION_FILL: Record<SpaceSuggestionAction, string> = {
  EXPAND: 'rgba(34, 139, 84, 0.45)',
  CONVERT: 'rgba(33, 73, 144, 0.40)',
  MAINTAIN: 'rgba(120, 113, 108, 0.25)',
  SUNSET: 'rgba(217, 119, 6, 0.45)',
};

const ACTION_STROKE: Record<SpaceSuggestionAction, string> = {
  EXPAND: '#1F8753',
  CONVERT: '#214990',
  MAINTAIN: '#78716C',
  SUNSET: '#B45309',
};

export function FloorplanHighlight({
  suggestions,
  hoveredId,
  onHover,
  className,
}: FloorplanHighlightProps) {
  const { t } = useTranslation('mall');

  const byFloor = suggestions.reduce<Record<string, SpaceSuggestion[]>>((acc, s) => {
    if (!s.svgPoints) return acc;
    (acc[s.zoneFloor] ??= []).push(s);
    return acc;
  }, {});

  const floors = Object.keys(byFloor).sort();

  return (
    <MallCard variant="glass" padding="md" className={cn('h-full', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-bo-neutral-950 uppercase tracking-wider">
          {t('spaceOptimizer.floorplan.title')}
        </h3>
        <Legend />
      </div>

      {floors.length === 0 ? (
        <div className="text-sm text-bo-neutral-400 py-8 text-center">
          {t('spaceOptimizer.floorplan.noZones')}
        </div>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => (
            <div key={floor}>
              <div className="text-xs uppercase tracking-wider text-bo-neutral-400 font-medium mb-2">
                {t('spaceOptimizer.floorplan.floor', { floor })}
              </div>
              <div className="aspect-[2/1] w-full rounded-lg bg-bo-neutral-100/60 border border-bo-neutral-200 overflow-hidden">
                <svg
                  viewBox="0 0 1000 550"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {byFloor[floor].map((s) => {
                    const isHovered = hoveredId === s.id;
                    const points = s.svgPoints ?? '';
                    const centroid = getCentroid(points);
                    return (
                      <g
                        key={s.id}
                        onMouseEnter={() => onHover?.(s.id)}
                        onMouseLeave={() => onHover?.(null)}
                        className="cursor-pointer transition-opacity"
                        style={{ opacity: hoveredId && !isHovered ? 0.45 : 1 }}
                      >
                        <polygon
                          points={points}
                          fill={ACTION_FILL[s.action]}
                          stroke={ACTION_STROKE[s.action]}
                          strokeWidth={isHovered ? 4 : 2}
                          strokeLinejoin="round"
                        />
                        <text
                          x={centroid.x}
                          y={centroid.y}
                          fontSize="20"
                          fontWeight="600"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#1C1C1B"
                          style={{ pointerEvents: 'none' }}
                        >
                          {s.zoneName}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </MallCard>
  );
}

function getCentroid(points: string): { x: number; y: number } {
  const coords = points
    .trim()
    .split(/\s+/)
    .map((p) => p.split(',').map(Number));
  if (coords.length === 0) return { x: 0, y: 0 };
  const sx = coords.reduce((s, [x]) => s + x, 0) / coords.length;
  const sy = coords.reduce((s, [, y]) => s + y, 0) / coords.length;
  return { x: sx, y: sy };
}

function Legend() {
  const { t } = useTranslation('mall');
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-bo-neutral-500 font-medium">
      <LegendDot color="#1F8753" label={t('spaceOptimizer.actions.EXPAND')} />
      <LegendDot color="#214990" label={t('spaceOptimizer.actions.CONVERT')} />
      <LegendDot color="#78716C" label={t('spaceOptimizer.actions.MAINTAIN')} />
      <LegendDot color="#B45309" label={t('spaceOptimizer.actions.SUNSET')} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
