import type {
  EvidenceClaim,
  PropertyActionRecommendation,
  VerifiedEvidenceSource,
} from '@stelthion/shoppermind-client-types';
import Link from 'next/link';
import { MessageSquareText, Megaphone } from 'lucide-react';
import { ActionEvidenceDrawer } from './ActionEvidenceDrawer';

export interface ActionCardLabels {
  effort: string;
  impact: string;
  whyNow: string;
  expectedKpi: string;
  competitorExample: string;
  noCompetitorExample: string;
  benchmark: string;
  showEvidence: string;
  openCampaign: string;
  discussAssistant: string;
  priority: string;
  property: string;
  priorityLabels: Record<PropertyActionRecommendation['priority'], string>;
  effortLabels: Record<PropertyActionRecommendation['effort'], string>;
  impactLabels: Record<PropertyActionRecommendation['impact'], string>;
  timeHorizonLabels: Record<PropertyActionRecommendation['timeHorizon'], string>;
  actionTypeLabels: Record<PropertyActionRecommendation['actionType'], string>;
}

function Metric({ label: metricLabel, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-lg border p-2 ${tone}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{metricLabel}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function displayTitle(action: PropertyActionRecommendation, labels: ActionCardLabels): string {
  if (action.title.length <= 42 && !/[.!?]/.test(action.title)) return action.title;
  return labels.actionTypeLabels[action.actionType];
}

function priorityTone(priority: PropertyActionRecommendation['priority']): string {
  if (priority === 'critical') return 'bg-bo-error-light text-bo-error-dark border-bo-error/30';
  if (priority === 'high') return 'bg-bo-warning-light text-bo-warning-dark border-bo-warning/30';
  return 'bg-bo-primary-100 text-bo-primary-800 border-bo-primary-200';
}

function metricTone(value: 'low' | 'medium' | 'high', kind: 'impact' | 'effort'): string {
  if (kind === 'impact') {
    if (value === 'high') return 'border-bo-success/30 bg-bo-success-light/40 text-bo-success-dark';
    if (value === 'medium') return 'border-bo-primary-200 bg-bo-primary-50 text-bo-primary-800';
    return 'border-bo-neutral-200 bg-bo-neutral-50 text-bo-neutral-700';
  }
  if (value === 'high') return 'border-bo-warning/30 bg-bo-warning-light/40 text-bo-warning-dark';
  if (value === 'medium') return 'border-bo-primary-200 bg-bo-primary-50 text-bo-primary-800';
  return 'border-bo-success/30 bg-bo-success-light/40 text-bo-success-dark';
}

export function ActionCard({
  action,
  claims,
  sources,
  labels,
  propertyName,
}: {
  action: PropertyActionRecommendation;
  claims: EvidenceClaim[];
  sources: VerifiedEvidenceSource[];
  labels: ActionCardLabels;
  propertyName: string;
}) {
  const firstCompetitor = action.competitorExamples[0];
  const priorityClass = priorityTone(action.priority);

  return (
    <article className="rounded-xl border border-bo-neutral-200 bg-gradient-to-br from-white to-bo-neutral-50 p-4 shadow-bo-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClass}`}>
              {labels.priority}: {labels.priorityLabels[action.priority]}
            </span>
            <span className="rounded border border-bo-neutral-200 bg-bo-neutral-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-bo-neutral-600">
              {labels.property}: {propertyName}
            </span>
            <span className="rounded border border-bo-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-bo-neutral-600">
              {labels.timeHorizonLabels[action.timeHorizon]}
            </span>
            <span className="rounded border border-bo-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-bo-neutral-600">
              {labels.actionTypeLabels[action.actionType]}
            </span>
          </div>
          <h3 className="truncate text-base font-semibold tracking-tight text-bo-neutral-950">
            {displayTitle(action, labels)}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-bo-neutral-700">{action.action}</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 text-xs md:w-52">
          <Metric label={labels.effort} value={labels.effortLabels[action.effort]} tone={metricTone(action.effort, 'effort')} />
          <Metric label={labels.impact} value={labels.impactLabels[action.impact]} tone={metricTone(action.impact, 'impact')} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <InfoBlock label={labels.whyNow} body={action.whyNow} tone="border-bo-primary-200 bg-bo-primary-50/70" />
        <InfoBlock label={labels.expectedKpi} body={action.expectedKpi} tone="border-bo-success/30 bg-bo-success-light/30" />
        <div className="rounded-lg border border-bo-accent/25 bg-bo-accent-light/25 p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-bo-accent-dark/80">
            {labels.competitorExample}
          </div>
          {firstCompetitor ? (
            <p className="text-xs leading-relaxed text-bo-neutral-700">
              <span className="font-medium text-bo-neutral-950">{firstCompetitor.propertyName}:</span>{' '}
              {firstCompetitor.observedMove}
            </p>
          ) : (
            <p className="text-xs text-bo-neutral-500">{labels.noCompetitorExample}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {action.relatedTrendIds.map((trend) => (
          <span key={trend} className="rounded-full border border-bo-neutral-200 bg-white px-2 py-1 text-[11px] text-bo-neutral-600">
            {trend}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-bo-neutral-200 pt-3">
        <Link
          href="/mall/campaigns"
          className="inline-flex items-center gap-1.5 rounded-lg bg-bo-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-bo-primary-800"
        >
          <Megaphone size={14} />
          {labels.openCampaign}
        </Link>
        <Link
          href="/mall/assistants"
          className="inline-flex items-center gap-1.5 rounded-lg border border-bo-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-bo-neutral-700 hover:bg-bo-neutral-50"
        >
          <MessageSquareText size={14} />
          {labels.discussAssistant}
        </Link>
      </div>

      <ActionEvidenceDrawer
        claims={claims}
        sources={sources}
        competitor={firstCompetitor}
        showEvidenceLabel={labels.showEvidence}
        benchmarkLabel={labels.benchmark}
      />
    </article>
  );
}

function InfoBlock({ label: blockLabel, body, tone }: { label: string; body: string; tone: string }) {
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-bo-neutral-600">{blockLabel}</div>
      <p className="text-xs leading-relaxed text-bo-neutral-700">{body}</p>
    </div>
  );
}
