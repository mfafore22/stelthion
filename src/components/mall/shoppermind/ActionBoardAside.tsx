'use client';

import { BarChart3, Gauge, Sparkles } from 'lucide-react';
import type { PropertyActionRecommendation } from '@stelthion/shoppermind-client-types';

const impactRank: Record<string, number> = { low: 1, medium: 2, high: 3 };
const effortRank: Record<string, number> = { low: 1, medium: 2, high: 3 };

export interface ActionBoardAsideLabels {
  impactVsEffort: string;
  highImpact: string;
  highEffort: string;
  actionCoverage: string;
  decisionContext: string;
  decisionContextBody: string;
}

function label(value: string): string {
  return value.replace(/_/g, ' ');
}

function zoneCounts(actions: PropertyActionRecommendation[]) {
  const counts = new Map<string, number>();
  for (const action of actions) {
    for (const zone of action.zoneTags) counts.set(zone, (counts.get(zone) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function bubblePosition(action: PropertyActionRecommendation, index: number, actions: PropertyActionRecommendation[]) {
  const sameCell = actions.filter((candidate) => candidate.effort === action.effort && candidate.impact === action.impact);
  const cellIndex = sameCell.findIndex((candidate) => candidate.id === action.id);
  const offsets = [
    [0, 0], [6, 0], [-6, 0], [0, 6], [0, -6], [6, 6], [-6, -6], [6, -6], [-6, 6],
  ];
  const [xOffset, yOffset] = offsets[cellIndex] ?? [((cellIndex % 3) - 1) * 8, Math.floor(cellIndex / 3) * 7];
  return {
    left: `${18 + (effortRank[action.effort] - 1) * 34 + xOffset}%`,
    bottom: `${18 + (impactRank[action.impact] - 1) * 34 + yOffset}%`,
    label: index + 1,
  };
}

export function ActionBoardAside({
  actions,
  labels,
}: {
  actions: PropertyActionRecommendation[];
  labels: ActionBoardAsideLabels;
}) {
  const zones = zoneCounts(actions);
  const maxZone = Math.max(1, ...zones.map((zone) => zone.count));

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-bo-neutral-200 bg-bo-neutral-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
          <Gauge size={16} className="text-bo-primary-600" />
          {labels.impactVsEffort}
        </div>
        <div className="relative h-56 overflow-hidden rounded-lg border border-bo-neutral-200 bg-white">
          <div className="absolute left-3 top-3 text-[10px] uppercase tracking-wider text-bo-neutral-400">{labels.highImpact}</div>
          <div className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wider text-bo-neutral-400">{labels.highEffort}</div>
          {actions.map((action, index) => {
            const position = bubblePosition(action, index, actions);
            return (
              <div
                key={action.id}
                title={action.title}
                className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-bo-primary-600 text-[11px] font-semibold text-white shadow"
                style={{ left: position.left, bottom: position.bottom }}
              >
                {position.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-bo-neutral-200 bg-bo-neutral-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
          <BarChart3 size={16} className="text-bo-primary-600" />
          {labels.actionCoverage}
        </div>
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={zone.zone}>
              <div className="mb-1 flex justify-between gap-2 text-xs text-bo-neutral-600">
                <span className="capitalize">{label(zone.zone)}</span>
                <span className="tabular-nums">{zone.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-bo-neutral-200 bg-white">
                <div className="h-full bg-bo-accent" style={{ width: `${(zone.count / maxZone) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-bo-neutral-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
          <Sparkles size={16} className="text-bo-primary-600" />
          {labels.decisionContext}
        </div>
        <p className="text-xs leading-relaxed text-bo-neutral-600">{labels.decisionContextBody}</p>
      </div>
    </aside>
  );
}
