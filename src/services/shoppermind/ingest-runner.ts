import prisma from '@/app/lib/prisma';
import { getFetcher } from './sources';
import { dedupeByExternalId } from './normaliser';
import { getMarketProfile } from './markets';
import { isRelevant } from './relevance';

export interface IngestOptions {
  limit?: number;
  sourceIds?: string[];
  force?: boolean;
}

export interface IngestSummary {
  sourcesRun: number;
  signalsNew: number;
  signalsSkipped: number;
  errors: number;
  durationMs: number;
}

export async function runIngestion(opts: IngestOptions = {}): Promise<IngestSummary> {
  const start = Date.now();
  const now = new Date();

  const sources = await prisma.signalSource.findMany({
    where: {
      active: true,
      ...(opts.sourceIds ? { id: { in: opts.sourceIds } } : {}),
      ...(opts.force || opts.sourceIds
        ? {}
        : { OR: [{ nextFetchAt: null }, { nextFetchAt: { lte: now } }] }),
    },
    take: opts.limit ?? 50,
  });

  let signalsNew = 0;
  let signalsSkipped = 0;
  let errors = 0;

  for (const source of sources) {
    const run = await prisma.ingestionRun.create({
      data: { sourceId: source.id, status: 'running' },
    });

    try {
      const fetcher = getFetcher(source.type);
      const result = await fetcher({
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        country: source.country,
        language: source.language,
        config: (source.config as Record<string, unknown> | null) ?? null,
      });

      const deduped = dedupeByExternalId(result.signals);
      const profile = getMarketProfile(source.country);
      // Statistical sources (StatFin, trade pubs) are curated — bypass the
      // retail/property keyword filter that's designed to cull RSS news noise.
      const trustedSource =
        source.type === 'STATFIN' || source.type === 'FRED' || source.type === 'TRADE_PUB';
      const filtered = profile && !trustedSource
        ? deduped.filter((s) => isRelevant(`${s.title} ${s.summary ?? ''}`, profile))
        : deduped;
      let newCount = 0;
      let skippedCount = deduped.length - filtered.length;

      for (const signal of filtered) {
        const res = await prisma.rawSignal.upsert({
          where: {
            sourceId_externalId: { sourceId: source.id, externalId: signal.externalId },
          },
          create: {
            sourceId: source.id,
            externalId: signal.externalId,
            title: signal.title,
            summary: signal.summary,
            url: signal.url,
            country: signal.country,
            language: signal.language,
            publishedAt: signal.publishedAt,
            metadata: (signal.metadata ?? {}) as object,
            embedding: [],
          },
          update: {},
          select: { ingestedAt: true },
        });
        // upsert doesn't tell us if it was an insert vs. no-op on update;
        // approximate via ingestedAt freshness (within last 5s = new).
        if (Date.now() - res.ingestedAt.getTime() < 5000) newCount++;
        else skippedCount++;
      }

      signalsNew += newCount;
      signalsSkipped += skippedCount;

      const nextFetchAt = computeNextFetch(source.type, now);
      await prisma.signalSource.update({
        where: { id: source.id },
        data: { lastFetchAt: now, nextFetchAt },
      });
      await prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          status: result.errorMsg ? 'error' : 'ok',
          signalsNew: newCount,
          signalsSkipped: skippedCount,
          errorMsg: result.errorMsg,
        },
      });
      if (result.errorMsg) errors++;
    } catch (err) {
      errors++;
      await prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          status: 'error',
          errorMsg: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return {
    sourcesRun: sources.length,
    signalsNew,
    signalsSkipped,
    errors,
    durationMs: Date.now() - start,
  };
}

function computeNextFetch(type: string, from: Date): Date {
  const minutes: Record<string, number> = {
    RSS: 30,
    GOOGLE_TRENDS: 360,
    STATFIN: 1440,
    FRED: 1440,
    REDDIT: 60,
    X: 30,
    TIKTOK: 360,
    TRADE_PUB: 120,
  };
  return new Date(from.getTime() + (minutes[type] ?? 60) * 60_000);
}
