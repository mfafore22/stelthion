import { prisma } from '../../db/prisma.js';

export interface SourceStrength {
  strongSourceCount: number;
  totalSourceCount: number;
  strongSourceNames: string[];
}

/**
 * Count distinct strong sources backing a phenomenon. A source is "strong"
 * when SignalSource.weight ≥ strongWeight (default 0.7, configurable per
 * market via policy.compositeSource.strongSourceWeight).
 *
 * Distinct on sourceId — the same publisher cited via three RawSignals still
 * counts once. Limited to RawSignals with publishedAt within `windowDays`
 * (default 90) so a stale single-citation phenomenon can't ride forever on
 * an old credential.
 */
export async function countStrongSources(
  phenomenonId: string,
  strongWeight = 0.7,
  windowDays = 90,
  now: Date = new Date(),
): Promise<SourceStrength> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await prisma().rawSignal.findMany({
    where: {
      phenomenonId,
      publishedAt: { gte: since },
    },
    select: { sourceId: true, source: { select: { weight: true, name: true } } },
  });

  const seen = new Map<string, { weight: number; name: string }>();
  for (const row of rows) {
    if (!row.source) continue;
    const existing = seen.get(row.sourceId);
    if (!existing || row.source.weight > existing.weight) {
      seen.set(row.sourceId, { weight: row.source.weight, name: row.source.name });
    }
  }

  const strongSourceNames: string[] = [];
  let strongSourceCount = 0;
  for (const entry of seen.values()) {
    if (entry.weight >= strongWeight) {
      strongSourceCount++;
      strongSourceNames.push(entry.name);
    }
  }

  return {
    strongSourceCount,
    totalSourceCount: seen.size,
    strongSourceNames,
  };
}
