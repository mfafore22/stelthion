export interface ParsedPhenomenonNarrative {
  summary: string;
  signalCommentary: string | null;
  retailerImpact: string | null;
}

const SIGNAL_MARKER = /\n\nSignal in [^:]+:\s*/;
const IMPACT_MARKER = /\n\nWhat this means for retailers:\s*/;

export function parsePhenomenonDescription(description: string): ParsedPhenomenonNarrative {
  const impactMatch = description.match(IMPACT_MARKER);
  const retailerImpact = impactMatch
    ? description.slice((impactMatch.index ?? 0) + impactMatch[0].length).trim()
    : null;

  const preImpact = impactMatch
    ? description.slice(0, impactMatch.index ?? description.length)
    : description;

  const signalMatch = preImpact.match(SIGNAL_MARKER);
  const signalCommentary = signalMatch
    ? preImpact.slice((signalMatch.index ?? 0) + signalMatch[0].length).trim()
    : null;

  const summary = signalMatch
    ? preImpact.slice(0, signalMatch.index ?? preImpact.length).trim()
    : preImpact.trim();

  return { summary, signalCommentary, retailerImpact };
}
