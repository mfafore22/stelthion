'use client';

import { BarChart3, ListChecks, Sparkles } from 'lucide-react';
import type { PropertyActionRecommendation } from '@stelthion/shoppermind-client-types';

export interface ActionBoardAsideLabels {
  impactVsEffort: string;
  prioritySummary: string;
  actionCoverage: string;
  decisionContext: string;
  decisionContextBody: string;
  priorityLabels: Record<PropertyActionRecommendation['priority'], string>;
  zoneLabels: Record<string, string>;
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

function priorityCounts(actions: PropertyActionRecommendation[]) {
  return (['critical', 'high', 'medium'] as const).map((priority) => ({
    priority,
    count: actions.filter((action) => action.priority === priority).length,
  }));
}

function priorityTone(priority: PropertyActionRecommendation['priority']): string {
  if (priority === 'critical') return 'bg-bo-error';
  if (priority === 'high') return 'bg-bo-warning';
  return 'bg-bo-primary-600';
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
  const priorities = priorityCounts(actions);
  const maxPriority = Math.max(1, ...priorities.map((priority) => priority.count));

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-bo-neutral-200 bg-bo-neutral-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
          <ListChecks size={16} className="text-bo-primary-600" />
          {labels.prioritySummary}
        </div>
        <div className="space-y-2">
          {priorities.map((item) => (
            <div key={item.priority}>
              <div className="mb-1 flex justify-between gap-2 text-xs text-bo-neutral-600">
                <span>{labels.priorityLabels[item.priority]}</span>
                <span className="tabular-nums">{item.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-bo-neutral-200 bg-white">
                <div className={`h-full ${priorityTone(item.priority)}`} style={{ width: `${(item.count / maxPriority) * 100}%` }} />
              </div>
            </div>
          ))}
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
                <span>{labels.zoneLabels[zone.zone] ?? zone.zone}</span>
                <span className="tabular-nums">{zone.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-bo-neutral-200 bg-white">
                <div className="h-full bg-bo-primary-600" style={{ width: `${(zone.count / maxZone) * 100}%` }} />
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
