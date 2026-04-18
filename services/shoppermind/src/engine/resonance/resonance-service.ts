import { prisma } from '../../db/prisma.js';

export interface ResonantMarket {
  marketId: string;
  country: string;
  compositeScore: number;
}

export interface ResonantPhenomenon {
  phenomenonId: string;
  phenomenonLabel: string | null;
  culturalScope: string | null;
  culturalLocality: string | null;
  phenomenonType: string | null;
  date: string;
  marketCount: number;
  avgCompositeScore: number;
  maxCompositeScore: number;
  markets: ResonantMarket[];
}

export interface ResonanceQuery {
  date: Date;
  marketId?: string;
  minMarkets?: number;
  minCompositeScore?: number;
}

/**
 * Cross-market resonance: a phenomenon scored above the minimum composite on
 * the same day in ≥ `minMarkets` distinct markets is surfaced as a resonant
 * item. Pure query over PhenomenonScore, no new persisted state — so the
 * "detection" is always fresh against the current score table.
 *
 * When `marketId` is provided, only resonances that include that market are
 * returned (useful for a dashboard tile: "these trends are also hitting in
 * Berlin and Tokyo"). The caller's own market is not filtered out of the
 * returned `markets` array so the UI can highlight it.
 */
export async function detectResonance(q: ResonanceQuery): Promise<ResonantPhenomenon[]> {
  const minMarkets = q.minMarkets ?? 2;
  const minScore = q.minCompositeScore ?? 0.3;

  const scores = await prisma().phenomenonScore.findMany({
    where: {
      date: q.date,
      compositeScore: { gte: minScore },
    },
    include: {
      phenomenon: {
        select: {
          id: true,
          label: true,
          culturalScope: true,
          culturalLocality: true,
          phenomenonType: true,
        },
      },
    },
  });

  const byPhenomenon = new Map<string, typeof scores>();
  for (const s of scores) {
    const list = byPhenomenon.get(s.phenomenonId) ?? [];
    list.push(s);
    byPhenomenon.set(s.phenomenonId, list);
  }

  const out: ResonantPhenomenon[] = [];
  for (const [phenomenonId, rows] of byPhenomenon.entries()) {
    if (rows.length < minMarkets) continue;
    if (q.marketId && !rows.some((r) => r.marketId === q.marketId)) continue;

    const p = rows[0]!.phenomenon;
    const markets: ResonantMarket[] = rows
      .map((r) => ({
        marketId: r.marketId,
        country: r.country,
        compositeScore: r.compositeScore,
      }))
      .sort((a, b) => b.compositeScore - a.compositeScore);

    const sum = markets.reduce((acc, m) => acc + m.compositeScore, 0);
    out.push({
      phenomenonId,
      phenomenonLabel: p.label ?? null,
      culturalScope: p.culturalScope ?? null,
      culturalLocality: p.culturalLocality ?? null,
      phenomenonType: p.phenomenonType ?? null,
      date: q.date.toISOString(),
      marketCount: markets.length,
      avgCompositeScore: sum / markets.length,
      maxCompositeScore: markets[0]!.compositeScore,
      markets,
    });
  }

  out.sort((a, b) => b.marketCount - a.marketCount || b.maxCompositeScore - a.maxCompositeScore);
  return out;
}
