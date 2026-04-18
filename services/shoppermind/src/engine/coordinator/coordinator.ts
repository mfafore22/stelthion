import { prisma } from '../../db/prisma.js';
import { listMarkets, loadMarket } from '../registry/market-registry.js';

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

// Phase 1 placeholder: the Coordinator is wired end-to-end but each stage
// is a no-op pending the engine port. Real stage handlers replace these
// functions in the next step of Phase 1.
async function runStage(stage: Stage, marketId: string): Promise<{ ok: true; notes: string }> {
  return { ok: true, notes: `${stage} stub` };
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

  return { runId: run.id, status, marketIds, stages, markets: perMarket };
}
