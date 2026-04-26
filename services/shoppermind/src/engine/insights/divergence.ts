import type { PhenomenonState } from '../../../node_modules/.prisma/shoppermind-client/index.js';

export interface MarketStateRow {
  marketId: string;
  state: PhenomenonState;
}

export interface DivergenceVerdict {
  divergent: boolean;
  // Distinct non-DORMANT/non-EMERGING states observed
  distinctStates: PhenomenonState[];
  // Pairs of (markets in ACCELERATING, markets in FADING/DORMANT) when both sides have ≥1 market
  contrasts: Array<{ accelerating: string[]; fading: string[] }>;
}

const ACCELERATING_STATES = new Set<PhenomenonState>(['ACCELERATING', 'EMERGING']);
const FADING_STATES = new Set<PhenomenonState>(['FADING', 'DORMANT']);

/**
 * Cross-market divergence detector. A phenomenon is divergent when:
 *  - it appears in ≥3 markets, AND
 *  - at least one market is ACCELERATING/EMERGING while at least one
 *    other market is FADING/DORMANT.
 *
 * "Stable in everywhere" is not divergent — that's just the steady state
 * of a long-running trend. The contrast tuple is what makes a signal
 * worth flagging as a surprise.
 */
export function detectDivergence(rows: MarketStateRow[]): DivergenceVerdict {
  const distinct = new Set<PhenomenonState>();
  const accelerating: string[] = [];
  const fading: string[] = [];

  for (const row of rows) {
    distinct.add(row.state);
    if (ACCELERATING_STATES.has(row.state)) accelerating.push(row.marketId);
    else if (FADING_STATES.has(row.state)) fading.push(row.marketId);
  }

  const divergent = rows.length >= 3 && accelerating.length > 0 && fading.length > 0;
  const contrasts =
    divergent && accelerating.length && fading.length
      ? [{ accelerating: accelerating.slice(), fading: fading.slice() }]
      : [];

  return {
    divergent,
    distinctStates: Array.from(distinct),
    contrasts,
  };
}
