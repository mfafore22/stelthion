import prisma from '@/app/lib/prisma';
import { getEmbeddingClient } from './embedding';
import { cosineSimilarity } from '@/lib/stats';
import { labelPhenomenon } from './prompts';

const SIMILARITY_THRESHOLD = 0.78;
const MERGE_THRESHOLD = 0.85;
const BATCH_SIZE = 50;

export interface ClusterSummary {
  signalsProcessed: number;
  assignedToExisting: number;
  newPhenomena: number;
  merged: number;
  durationMs: number;
}

export async function runClustering(): Promise<ClusterSummary> {
  const start = Date.now();
  const embedder = getEmbeddingClient();

  const unassigned = await prisma.rawSignal.findMany({
    where: { phenomenonId: null, embedding: { isEmpty: true } },
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

      await prisma.rawSignal.update({
        where: { id: signal.id },
        data: { embedding: vec },
      });

      const match = await findClosestPhenomenon(vec, signal.country);
      if (match) {
        await prisma.rawSignal.update({
          where: { id: signal.id },
          data: { phenomenonId: match.id },
        });
        await updateCentroid(match.id, vec);
        await prisma.phenomenon.update({
          where: { id: match.id },
          data: { lastSignalAt: signal.publishedAt },
        });
        assignedToExisting++;
      } else {
        const label = await labelPhenomenon([signal.title], signal.country);
        const phenom = await prisma.phenomenon.create({
          data: {
            label: label.label,
            description: label.description,
            primaryCountry: signal.country,
            categories: label.categories,
            keywords: extractKeywords(signal.title),
            centroid: vec,
            state: 'EMERGING',
          },
        });
        await prisma.rawSignal.update({
          where: { id: signal.id },
          data: { phenomenonId: phenom.id },
        });
        newPhenomena++;
      }
      signalsProcessed++;
    }
  }

  const merged = await runMergeCompaction();

  return {
    signalsProcessed,
    assignedToExisting,
    newPhenomena,
    merged,
    durationMs: Date.now() - start,
  };
}

async function findClosestPhenomenon(
  vec: number[],
  country: string,
): Promise<{ id: string; centroid: number[] } | null> {
  const phenomena = await prisma.phenomenon.findMany({
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
  const p = await prisma.phenomenon.findUnique({
    where: { id: phenomenonId },
    select: { centroid: true },
  });
  if (!p || p.centroid.length === 0) return;

  const signalCount = await prisma.rawSignal.count({ where: { phenomenonId } });
  const w = 1 / Math.max(signalCount, 1);
  const updated = p.centroid.map((c, i) => c * (1 - w) + newVec[i] * w);

  await prisma.phenomenon.update({
    where: { id: phenomenonId },
    data: { centroid: updated },
  });
}

async function runMergeCompaction(): Promise<number> {
  const all = await prisma.phenomenon.findMany({
    where: { mergedInto: null },
    select: { id: true, label: true, primaryCountry: true, centroid: true },
  });

  let merged = 0;
  const consumed = new Set<string>();

  for (let i = 0; i < all.length; i++) {
    if (consumed.has(all[i].id)) continue;
    for (let j = i + 1; j < all.length; j++) {
      if (consumed.has(all[j].id)) continue;
      if (all[i].primaryCountry !== all[j].primaryCountry) continue;
      if (all[i].centroid.length === 0 || all[j].centroid.length === 0) continue;

      const sim = cosineSimilarity(all[i].centroid, all[j].centroid);
      if (sim >= MERGE_THRESHOLD) {
        await prisma.phenomenon.update({
          where: { id: all[j].id },
          data: { mergedInto: all[i].id, state: 'DORMANT' },
        });
        await prisma.rawSignal.updateMany({
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
