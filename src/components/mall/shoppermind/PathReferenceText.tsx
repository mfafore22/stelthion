'use client';

import type { ReactNode } from 'react';

export type ScenarioPathId = 'a' | 'b' | 'c';

const PATH_REFERENCE_RE =
  /\b((?:Path|path|Polku|polku|Polut|polut|Polun|polun|Polussa|polussa|Polusta|polusta|Polkua|polkua|Polulla|polulla)\s+([ABCabc])|([ABCabc])-(?:polku|polut|polun|polussa|polusta|polkua|polulla))\b/g;

export function PathReferenceText({
  text,
  onSelectPath,
}: {
  text: string;
  onSelectPath?: (pathId: ScenarioPathId) => void;
}) {
  if (!onSelectPath) return <>{text}</>;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(PATH_REFERENCE_RE)) {
    const full = match[1];
    const letter = (match[2] ?? match[3])?.toLowerCase() as ScenarioPathId | undefined;
    if (!full || !letter || match.index === undefined) continue;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <button
        key={`${match.index}-${full}`}
        type="button"
        onClick={() => onSelectPath(letter)}
        className="font-medium text-bo-primary-700 underline decoration-bo-primary-300 underline-offset-2 hover:text-bo-primary-900"
      >
        {full}
      </button>,
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex === 0) return <>{text}</>;
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return <>{nodes}</>;
}
