'use client';

import { ExternalLink, MapPinned } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MegaSource } from '@/lib/shoppermind/megaScenario';
import { PathReferenceText, type ScenarioPathId } from './PathReferenceText';

export interface BenchmarkLesson {
  id: string;
  name: string;
  item: string;
}

export function InfoPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPinned;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bo-surface-subtle rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bo-neutral-950">
        <Icon size={16} className="text-bo-primary-700" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function SourceList({ sources }: { sources: MegaSource[] }) {
  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <a
          key={`${source.id}-${source.url}`}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bo-interactive-box block rounded-lg p-2 text-xs leading-snug text-bo-primary-700"
        >
          <span className="font-medium">{source.publisher}</span>
          <span className="mx-1 text-bo-neutral-400">·</span>
          <span>{source.title}</span>
          <ExternalLink size={10} className="ml-1 inline" />
        </a>
      ))}
    </div>
  );
}

export function BenchmarkGrid({
  items,
  onSelectScenarioPath,
}: {
  items: BenchmarkLesson[];
  onSelectScenarioPath?: (pathId: ScenarioPathId) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="bo-surface-subtle bo-surface-hover rounded-lg border p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-bo-neutral-500">{item.name}</div>
          <p className="mt-1 text-sm leading-relaxed text-bo-neutral-700">
            <PathReferenceText text={item.item} onSelectPath={onSelectScenarioPath} />
          </p>
        </div>
      ))}
    </div>
  );
}
