import { prisma } from '../../db/prisma.js';

export interface SourceEvidence {
  sourceIds: string[];
  sourceCount: number;
  strongSourceCount: number;
}

const STRONG_SOURCE_WEIGHT = 0.7;

export async function loadPhenomenonSourceEvidence(
  phenomenonId: string,
  marketId: string,
): Promise<SourceEvidence> {
  const map = await loadPhenomenonSourceEvidenceMap([phenomenonId], marketId);
  return map.get(phenomenonId) ?? emptyEvidence();
}

export async function loadPhenomenonSourceEvidenceMap(
  phenomenonIds: string[],
  marketId: string,
): Promise<Map<string, SourceEvidence>> {
  const uniquePhenomenonIds = Array.from(new Set(phenomenonIds)).filter(Boolean);
  if (uniquePhenomenonIds.length === 0) return new Map();

  const signalSources = await prisma().rawSignal.findMany({
    where: { phenomenonId: { in: uniquePhenomenonIds } },
    select: { phenomenonId: true, sourceId: true },
    distinct: ['phenomenonId', 'sourceId'],
  });
  const sourceIds = Array.from(new Set(signalSources.map((row) => row.sourceId)));
  const sources = sourceIds.length
    ? await prisma().signalSource.findMany({
        where: {
          id: { in: sourceIds },
          OR: [{ marketId }, { marketId: null }],
        },
        select: { id: true, weight: true },
      })
    : [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const byPhenomenon = new Map<string, Map<string, number>>();

  for (const row of signalSources) {
    if (!row.phenomenonId) continue;
    const source = sourceById.get(row.sourceId);
    if (!source) continue;
    const bucket = byPhenomenon.get(row.phenomenonId) ?? new Map<string, number>();
    bucket.set(row.sourceId, source.weight);
    byPhenomenon.set(row.phenomenonId, bucket);
  }

  const evidence = new Map<string, SourceEvidence>();
  for (const phenomenonId of uniquePhenomenonIds) {
    const bucket = byPhenomenon.get(phenomenonId) ?? new Map();
    evidence.set(phenomenonId, {
      sourceIds: Array.from(bucket.keys()),
      sourceCount: bucket.size,
      strongSourceCount: Array.from(bucket.values()).filter(
        (weight) => weight >= STRONG_SOURCE_WEIGHT,
      ).length,
    });
  }
  return evidence;
}

function emptyEvidence(): SourceEvidence {
  return { sourceIds: [], sourceCount: 0, strongSourceCount: 0 };
}
