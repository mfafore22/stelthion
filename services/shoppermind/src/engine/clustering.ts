import { prisma } from '../db/prisma.js';
import { getEmbeddingClient } from './llm/client.js';
import { cosineSimilarity } from './lib/stats.js';
import { labelPhenomenon } from './prompts.js';
import { loadMarket } from './registry/market-registry.js';
import { resolveLocality } from './locality/locality-resolver.js';
import { classify } from './taxonomy/classifier.js';
import { inferLinks, type LinkablePhenomenon } from './linking/link-inferrer.js';
import type { PhenomenonType, Scope } from './policy/policy-types.js';

const SIMILARITY_THRESHOLD = 0.78;
const MERGE_THRESHOLD = 0.85;
const BATCH_SIZE = 50;

export interface ClusterSummary {
  marketId: string;
  signalsProcessed: number;
  assignedToExisting: number;
  newPhenomena: number;
  merged: number;
  durationMs: number;
}

export async function runClustering(marketId: string): Promise<ClusterSummary> {
  const start = Date.now();
  const now = new Date();
  const db = prisma();
  const market = await loadMarket(marketId);
  if (!market) {
    return { marketId, signalsProcessed: 0, assignedToExisting: 0, newPhenomena: 0, merged: 0, durationMs: 0 };
  }
  const embedder = getEmbeddingClient();

  const unassigned = await db.rawSignal.findMany({
    where: { phenomenonId: null, embedding: { isEmpty: true }, country: market.country },
    take: BATCH_SIZE * 4,
    orderBy: { ingestedAt: 'desc' },
  });

  let signalsProcessed = 0;
  let assignedToExisting = 0;
  let newPhenomena = 0;

  for (let i = 0; i < unassigned.length; i += BATCH_SIZE) {
    const batch = unassigned.slice(i, i + BATCH_SIZE);
    const texts = batch.map((s) => `${s.title} ${s.summary ?? ''}`);
    const embeddings = await embedder.embed(texts);

    for (let j = 0; j < batch.length; j++) {
      const signal = batch[j];
      const vec = embeddings[j];

      const locality = resolveLocality(
        {
          externalId: signal.externalId,
          title: signal.title,
          summary: signal.summary ?? undefined,
          url: signal.url ?? undefined,
          country: signal.country,
          language: signal.language,
          publishedAt: signal.publishedAt,
          metadata: (signal.metadata as Record<string, unknown> | null) ?? undefined,
        },
        market,
      );

      await db.rawSignal.update({
        where: { id: signal.id },
        data: {
          embedding: vec,
          footTrafficScope: locality.footTraffic.scope,
          footTrafficLocality: locality.footTraffic.localityId,
          culturalScope: locality.cultural.scope,
          culturalLocality: locality.cultural.localityId,
        },
      });

      // Phase 1: cluster within the market's country. Phase 2 partitions on
      // cultural (scope, localityId) so cross-country phenomena can share a
      // cluster when they're on a GLOBAL cultural axis.
      const match = await findClosestPhenomenon(vec, signal.country);
      if (match) {
        await db.rawSignal.update({
          where: { id: signal.id },
          data: { phenomenonId: match.id },
        });
        await updateCentroid(match.id, vec);
        await db.phenomenon.update({
          where: { id: match.id },
          data: { lastSignalAt: signal.publishedAt },
        });
        assignedToExisting++;
      } else {
        const label = await labelPhenomenon(
          [signal.title],
          market.profile,
          market.country,
        );
        const keywords = extractKeywords(signal.title);
        const classification = classify(
          { label: label.label, description: label.description, keywords },
          now,
        );
        const phenom = await db.phenomenon.create({
          data: {
            label: label.label,
            description: label.description,
            primaryCountry: signal.country,
            categories: label.categories,
            keywords,
            centroid: vec,
            state: 'EMERGING',
            footTrafficScope: locality.footTraffic.scope,
            footTrafficLocality: locality.footTraffic.localityId,
            culturalScope: locality.cultural.scope,
            culturalLocality: locality.cultural.localityId,
            phenomenonType: classification.type,
            eventStart: classification.eventStart ?? null,
            eventEnd: classification.eventEnd ?? null,
            // lifecycleState is recomputed each scoring run so it stays fresh
            // as now() crosses eventStart / eventEnd + fadeWindow.
            lifecycleState: null,
          },
        });
        await db.rawSignal.update({
          where: { id: signal.id },
          data: { phenomenonId: phenom.id },
        });
        newPhenomena++;
      }
      signalsProcessed++;
    }
  }

  const merged = await runMergeCompaction(market.country);

  // Re-infer links for phenomena in this country that received signals recently
  // enough to have changed during this run. Idempotent via (from, to, linkType)
  // unique key; previously-authored links are preserved.
  if (signalsProcessed > 0 || newPhenomena > 0) {
    await refreshLinks(market.country, now);
  }

  return {
    marketId,
    signalsProcessed,
    assignedToExisting,
    newPhenomena,
    merged,
    durationMs: Date.now() - start,
  };
}

async function refreshLinks(country: string, now: Date): Promise<void> {
  const db = prisma();
  // Scope: phenomena in the same primaryCountry, active (not merged, not DORMANT).
  // Link inference itself filters further on cultural scope equality.
  const rows = await db.phenomenon.findMany({
    where: {
      primaryCountry: country,
      mergedInto: null,
      state: { not: 'DORMANT' },
    },
    select: {
      id: true,
      label: true,
      keywords: true,
      phenomenonType: true,
      culturalScope: true,
      culturalLocality: true,
      eventStart: true,
      eventEnd: true,
      lifecycleState: true,
    },
  });

  if (rows.length < 2) return;

  const linkables: LinkablePhenomenon[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    keywords: r.keywords,
    type: (r.phenomenonType ?? 'TREND') as PhenomenonType,
    culturalScope: (r.culturalScope ?? 'COUNTRY') as Scope,
    culturalLocality: r.culturalLocality ?? country,
    eventStart: r.eventStart,
    eventEnd: r.eventEnd,
    lifecycleState: r.lifecycleState as LinkablePhenomenon['lifecycleState'],
  }));

  for (const target of linkables) {
    const links = inferLinks(target, linkables, now);
    for (const link of links) {
      await db.phenomenonLink.upsert({
        where: {
          fromPhenomenonId_toPhenomenonId_linkType: {
            fromPhenomenonId: link.fromPhenomenonId,
            toPhenomenonId: link.toPhenomenonId,
            linkType: link.linkType,
          },
        },
        create: {
          fromPhenomenonId: link.fromPhenomenonId,
          toPhenomenonId: link.toPhenomenonId,
          linkType: link.linkType,
          weight: link.weight,
          inferredBy: 'rule-v1',
          rationale: link.rationale,
        },
        update: {
          weight: link.weight,
          rationale: link.rationale,
          supersededAt: null,
        },
      });
    }
  }
}

async function findClosestPhenomenon(
  vec: number[],
  country: string,
): Promise<{ id: string; centroid: number[] } | null> {
  const phenomena = await prisma().phenomenon.findMany({
    where: { primaryCountry: country, mergedInto: null },
    select: { id: true, centroid: true },
  });

  let best: { id: string; centroid: number[] } | null = null;
  let bestSim = SIMILARITY_THRESHOLD;

  for (const p of phenomena) {
    if (p.centroid.length === 0) continue;
    const sim = cosineSimilarity(vec, p.centroid);
    if (sim > bestSim) {
      bestSim = sim;
      best = { id: p.id, centroid: p.centroid };
    }
  }
  return best;
}

async function updateCentroid(phenomenonId: string, newVec: number[]) {
  const db = prisma();
  const p = await db.phenomenon.findUnique({
    where: { id: phenomenonId },
    select: { centroid: true },
  });
  if (!p || p.centroid.length === 0) return;

  const signalCount = await db.rawSignal.count({ where: { phenomenonId } });
  const w = 1 / Math.max(signalCount, 1);
  const updated = p.centroid.map((c, i) => c * (1 - w) + newVec[i] * w);

  await db.phenomenon.update({
    where: { id: phenomenonId },
    data: { centroid: updated },
  });
}

async function runMergeCompaction(country: string): Promise<number> {
  const db = prisma();
  const all = await db.phenomenon.findMany({
    where: { primaryCountry: country, mergedInto: null },
    select: { id: true, label: true, primaryCountry: true, centroid: true },
  });

  let merged = 0;
  const consumed = new Set<string>();

  for (let i = 0; i < all.length; i++) {
    if (consumed.has(all[i].id)) continue;
    for (let j = i + 1; j < all.length; j++) {
      if (consumed.has(all[j].id)) continue;
      if (all[i].centroid.length === 0 || all[j].centroid.length === 0) continue;

      const sim = cosineSimilarity(all[i].centroid, all[j].centroid);
      if (sim >= MERGE_THRESHOLD) {
        await db.phenomenon.update({
          where: { id: all[j].id },
          data: { mergedInto: all[i].id, state: 'DORMANT' },
        });
        await db.rawSignal.updateMany({
          where: { phenomenonId: all[j].id },
          data: { phenomenonId: all[i].id },
        });
        consumed.add(all[j].id);
        merged++;
      }
    }
  }
  return merged;
}

function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 10);
}
