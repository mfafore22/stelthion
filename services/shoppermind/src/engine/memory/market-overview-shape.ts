import { prisma } from '../../db/prisma.js';
import { qualityViewFromScore } from '../quality/envelope.js';
import { loadPhenomenonSourceEvidenceMap } from '../quality/source-evidence.js';

type JsonRow = Record<string, unknown>;
type RawRow = Record<string, any>;

export async function pickLatestPhenomena(
  rows: RawRow[],
  limit: number,
  marketId: string,
): Promise<JsonRow[]> {
  const seen = new Set<string>();
  const selected: RawRow[] = [];
  for (const row of rows) {
    if (seen.has(row.phenomenonId)) continue;
    seen.add(row.phenomenonId);
    selected.push(row);
    if (selected.length >= limit) break;
  }
  const evidenceByPhenomenon = await loadPhenomenonSourceEvidenceMap(
    selected.map((row) => row.phenomenonId),
    marketId,
  );
  const out: JsonRow[] = [];
  for (const s of selected) {
    out.push({
      id: s.phenomenon.id,
      label: s.phenomenon.label,
      description: s.phenomenon.description,
      state: s.phenomenon.state,
      phenomenonType: s.phenomenon.phenomenonType,
      lifecycleState: s.phenomenon.lifecycleState,
      culturalScope: s.phenomenon.culturalScope,
      culturalLocality: s.phenomenon.culturalLocality,
      footTrafficScope: s.phenomenon.footTrafficScope,
      footTrafficLocality: s.phenomenon.footTrafficLocality,
      compositeScore: s.compositeScore,
      footTrafficScore: s.footTrafficScore,
      culturalScore: s.culturalScore,
      categories: s.phenomenon.categories ?? [],
      keywords: s.phenomenon.keywords ?? [],
      latestVelocity: s.velocity,
      i18n: s.phenomenon.i18n ?? null,
      qualityView: qualityViewFromScore(s, evidenceByPhenomenon.get(s.phenomenonId)),
    });
  }
  return out;
}

export async function attachRecentScores(
  phenomena: RawRow[],
  marketId: string,
): Promise<void> {
  const ids = phenomena.map((p) => p.id as string);
  if (ids.length === 0) return;
  const rows = await prisma().phenomenonScore.findMany({
    where: { marketId, phenomenonId: { in: ids } },
    orderBy: [{ date: 'desc' }],
    take: ids.length * 14,
  });
  for (const p of phenomena) {
    p.recentScores = rows
      .filter((r) => r.phenomenonId === p.id)
      .slice(0, 14)
      .map(dateSafe);
  }
}

export function publicMarket(market: JsonRow): JsonRow {
  const { policy: _policy, geoAnchorLat: _lat, geoAnchorLon: _lon, ...safe } = market;
  return safe;
}

export function dateSafe(row: RawRow): JsonRow {
  return JSON.parse(JSON.stringify(row)) as JsonRow;
}
