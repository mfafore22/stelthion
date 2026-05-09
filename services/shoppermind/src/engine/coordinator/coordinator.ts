import { prisma } from '../../db/prisma.js';
import { listMarkets, loadMarket } from '../registry/market-registry.js';
import { runIngestion } from '../ingest-runner.js';
import { runClustering } from '../clustering.js';
import { runScoring } from '../scoring.js';
import { runPublisher } from '../publisher.js';
import { refreshMarketMemoryCaches } from '../memory/retrieval-memory.js';

export type Stage = 'ingest' | 'cluster' | 'score' | 'publish';
const DEFAULT_STAGES: Stage[] = ['ingest', 'cluster', 'score', 'publish'];

export type RunArgs = {
  marketIds?: string[];
  stages?: Stage[];
};

export type MarketRunSummary = {
  marketId: string;
  ok: boolean;
  error?: string;
  stages: Record<Stage, { ok: boolean; error?: string; notes?: string }>;
};

export type RunSummary = {
  runId: string;
  status: 'ok' | 'partial' | 'error';
  marketIds: string[];
  stages: Stage[];
  markets: MarketRunSummary[];
};

async function runStage(stage: Stage, marketId: string): Promise<{ ok: true; notes: string }> {
  switch (stage) {
    case 'ingest': {
      const res = await runIngestion({ marketId });
      return {
        ok: true,
        notes: `sources=${res.sourcesRun} new=${res.signalsNew} skipped=${res.signalsSkipped} errors=${res.errors}`,
      };
    }
    case 'cluster': {
      const res = await runClustering(marketId);
      return {
        ok: true,
        notes: `processed=${res.signalsProcessed} assigned=${res.assignedToExisting} new=${res.newPhenomena} merged=${res.merged}`,
      };
    }
    case 'score': {
      const res = await runScoring(marketId);
      return {
        ok: true,
        notes: `scored=${res.phenomenaScored} stateChanges=${res.stateChanges}`,
      };
    }
    case 'publish': {
      const res = await runPublisher(marketId);
      return {
        ok: true,
        notes: `published=${res.published} reviewed=${res.reviewed} rejected=${res.rejected} skipped=${res.skipped} errors=${res.errors}`,
      };
    }
  }
}

export async function runPipeline(args: RunArgs = {}): Promise<RunSummary> {
  const stages = (args.stages ?? DEFAULT_STAGES) as Stage[];

  let marketIds: string[];
  if (args.marketIds && args.marketIds.length > 0) {
    marketIds = args.marketIds;
  } else {
    marketIds = (await listMarkets()).map((m) => m.id);
  }

  const run = await prisma().coordinatorRun.create({
    data: {
      status: 'running',
      marketIds,
      stages,
      summary: {},
    },
  });

  const perMarket: MarketRunSummary[] = [];
  for (const marketId of marketIds) {
    const market = await loadMarket(marketId);
    if (!market) {
      perMarket.push({
        marketId,
        ok: false,
        error: 'market_not_found',
        stages: Object.fromEntries(stages.map((s) => [s, { ok: false, error: 'market_not_found' }])) as Record<
          Stage,
          { ok: boolean; error?: string }
        >,
      });
      continue;
    }

    const stageResults: Record<Stage, { ok: boolean; error?: string; notes?: string }> = {
      ingest: { ok: true },
      cluster: { ok: true },
      score: { ok: true },
      publish: { ok: true },
    };
    let marketOk = true;
    for (const stage of stages) {
      try {
        const res = await runStage(stage, marketId);
        stageResults[stage] = { ok: true, notes: res.notes };
      } catch (err) {
        marketOk = false;
        stageResults[stage] = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
    perMarket.push({ marketId, ok: marketOk, stages: stageResults });
  }

  const status: RunSummary['status'] =
    perMarket.every((m) => m.ok) ? 'ok' : perMarket.some((m) => m.ok) ? 'partial' : 'error';

  await prisma().coordinatorRun.update({
    where: { id: run.id },
    data: {
      status,
      finishedAt: new Date(),
      summary: { markets: perMarket } as unknown as object,
    },
  });

  await refreshSuccessfulMarketCaches(perMarket);

  return { runId: run.id, status, marketIds, stages, markets: perMarket };
}

async function refreshSuccessfulMarketCaches(markets: MarketRunSummary[]): Promise<void> {
  await Promise.all(
    markets
      .filter((market) => market.ok)
      .map((market) => refreshMarketMemoryCaches(market.marketId).catch(() => undefined)),
  );
}
