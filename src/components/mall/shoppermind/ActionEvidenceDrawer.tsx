import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type {
  CompetitorExample,
  EvidenceClaim,
  VerifiedEvidenceSource,
} from '@stelthion/shoppermind-client-types';
import { PathReferenceText, type ScenarioPathId } from './PathReferenceText';

function sourceForClaim(claim: EvidenceClaim, sources: VerifiedEvidenceSource[]) {
  return sources.find((source) => source.id === claim.sourceId) ?? null;
}

export function ActionEvidenceDrawer({
  claims,
  sources,
  competitor,
  showEvidenceLabel,
  benchmarkLabel,
  onSelectScenarioPath,
}: {
  claims: EvidenceClaim[];
  sources: VerifiedEvidenceSource[];
  competitor?: CompetitorExample;
  showEvidenceLabel: string;
  benchmarkLabel: string;
  onSelectScenarioPath?: (pathId: ScenarioPathId) => void;
}) {
  return (
    <details className="bo-surface-subtle mt-3 rounded-lg border">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-bo-neutral-700">{showEvidenceLabel}</summary>
      <div className="space-y-2 border-t border-bo-neutral-200 px-3 py-3">
        {claims.map((claim) => {
          const source = sourceForClaim(claim, sources);
          return (
            <div key={claim.id} className="text-xs leading-relaxed text-bo-neutral-700">
              <div className="font-medium text-bo-neutral-950">
                <PathReferenceText text={claim.text} onSelectPath={onSelectScenarioPath} />
              </div>
              {source && (
                <a href={source.url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-bo-primary-700 hover:underline">
                  {source.publisher} · {source.title}
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          );
        })}
        {competitor && (
          <div className="rounded-md bg-bo-warning-light/40 p-2 text-xs text-bo-neutral-700">
            <span className="font-medium text-bo-neutral-950">{benchmarkLabel}:</span>{' '}
            <PathReferenceText text={competitor.whyItMatters} onSelectPath={onSelectScenarioPath} />
            <ArrowUpRight size={12} className="ml-1 inline text-bo-warning-dark" />
          </div>
        )}
      </div>
    </details>
  );
}
