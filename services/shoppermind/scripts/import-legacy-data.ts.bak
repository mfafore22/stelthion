/**
 * One-shot legacy-data import for the ShopperMind service cutover.
 *
 * Reads from the main Next.js Postgres (SOURCE_DATABASE_URL) via raw SQL and
 * writes into shoppermind_db (DATABASE_URL) via Prisma. Applies the Phase 1
 * backfill: every legacy row is stamped with COUNTRY/primaryCountry on both
 * locality axes, phenomenonType=TREND, proximity=1.0 on both axes, linkBoost=0.
 *
 * PhenomenonScore is fanned out: one legacy row per (phenomenonId, country, date)
 * becomes N target rows, one per Market in that country. With default axis
 * weights 0.5/0.5 and both per-axis scores set to legacy.compositeScore, the
 * new composite equals the legacy composite — the invariant this script asserts.
 *
 * Idempotent: re-running is safe; upsert-by-natural-key everywhere.
 *
 * Usage:
 *   SOURCE_DATABASE_URL=postgres://... \
 *   DATABASE_URL=postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db \
 *   tsx services/shoppermind/scripts/import-legacy-data.ts
 */

import pg from 'pg';
import { prisma } from '../src/db/prisma.js';
import { listMarkets } from '../src/engine/registry/market-registry.js';

interface LegacySignalSource {
  id: string;
  name: string;
  type: string;
  url: string;
  country: string;
  language: string;
  weight: number;
  active: boolean;
  lastFetchAt: Date | null;
  nextFetchAt: Date | null;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface LegacyRawSignal {
  id: string;
  sourceId: string;
  externalId: string;
  title: string;
  summary: string | null;
  url: string | null;
  country: string;
  language: string;
  publishedAt: Date;
  ingestedAt: Date;
  embedding: number[];
  metadata: unknown;
  phenomenonId: string | null;
}

interface LegacyPhenomenon {
  id: string;
  label: string;
  description: string;
  primaryCountry: string;
  categories: string[];
  state: string;
  firstSeenAt: Date;
  lastSignalAt: Date;
  mergedInto: string | null;
  keywords: string[];
  centroid: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface LegacyPhenomenonScore {
  id: string;
  phenomenonId: string;
  country: string;
  date: Date;
  volume: number;
  velocity: number;
  acceleration: number;
  noiseAdjusted: number;
  sourceDiversity: number;
  compositeScore: number;
}

interface LegacyPhenomenonFeedback {
  id: string;
  phenomenonId: string;
  userId: string;
  verdict: string;
  note: string | null;
  createdAt: Date;
}

interface LegacySignalOfTheDay {
  id: string;
  country: string;
  date: Date;
  phenomenonIds: string[];
  narrative: string;
  publishedAt: Date;
}

interface LegacyIngestionRun {
  id: string;
  sourceId: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  signalsNew: number;
  signalsSkipped: number;
  errorMsg: string | null;
}

interface ImportReport {
  sources: number;
  signals: number;
  phenomena: number;
  scoresLegacy: number;
  scoresWritten: number;
  scoresSkipped: number;
  signalOfTheDayLegacy: number;
  signalOfTheDayWritten: number;
  feedback: number;
  runs: number;
  invariantMaxDelta: number;
  invariantSamples: number;
  invariantFailures: string[];
}

async function main() {
  const src = new pg.Client({ connectionString: process.env.SOURCE_DATABASE_URL });
  await src.connect();
  const db = prisma();

  const markets = await listMarkets();
  const marketsByCountry = new Map<string, typeof markets>();
  for (const m of markets) {
    const list = marketsByCountry.get(m.country) ?? [];
    list.push(m);
    marketsByCountry.set(m.country, list);
  }

  const report: ImportReport = {
    sources: 0,
    signals: 0,
    phenomena: 0,
    scoresLegacy: 0,
    scoresWritten: 0,
    scoresSkipped: 0,
    signalOfTheDayLegacy: 0,
    signalOfTheDayWritten: 0,
    feedback: 0,
    runs: 0,
    invariantMaxDelta: 0,
    invariantSamples: 0,
    invariantFailures: [],
  };

  console.log('[1/7] Copying SignalSource…');
  const srcSources = await src.query<LegacySignalSource>('SELECT * FROM "SignalSource"');
  for (const row of srcSources.rows) {
    await db.signalSource.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        name: row.name,
        type: row.type as never,
        url: row.url,
        country: row.country,
        language: row.language,
        weight: row.weight,
        active: row.active,
        marketId: null,
        defaultFootTrafficScope: 'COUNTRY',
        defaultCulturalScope: 'COUNTRY',
        lastFetchAt: row.lastFetchAt,
        nextFetchAt: row.nextFetchAt,
        config: (row.config ?? null) as never,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      update: {},
    });
    report.sources++;
  }

  console.log('[2/7] Copying Phenomenon…');
  const srcPhenomena = await src.query<LegacyPhenomenon>('SELECT * FROM "Phenomenon"');
  for (const row of srcPhenomena.rows) {
    await db.phenomenon.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        label: row.label,
        description: row.description,
        primaryCountry: row.primaryCountry,
        categories: row.categories,
        state: row.state as never,
        firstSeenAt: row.firstSeenAt,
        lastSignalAt: row.lastSignalAt,
        mergedInto: row.mergedInto,
        keywords: row.keywords,
        centroid: row.centroid,
        footTrafficScope: 'COUNTRY',
        footTrafficLocality: row.primaryCountry,
        culturalScope: 'COUNTRY',
        culturalLocality: row.primaryCountry,
        phenomenonType: 'TREND',
        lifecycleState: null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      update: {},
    });
    report.phenomena++;
  }

  console.log('[3/7] Copying RawSignal…');
  const srcSignals = await src.query<LegacyRawSignal>('SELECT * FROM "RawSignal"');
  for (const row of srcSignals.rows) {
    await db.rawSignal.upsert({
      where: { sourceId_externalId: { sourceId: row.sourceId, externalId: row.externalId } },
      create: {
        id: row.id,
        sourceId: row.sourceId,
        externalId: row.externalId,
        title: row.title,
        summary: row.summary,
        url: row.url,
        country: row.country,
        language: row.language,
        publishedAt: row.publishedAt,
        ingestedAt: row.ingestedAt,
        embedding: row.embedding,
        metadata: (row.metadata ?? null) as never,
        phenomenonId: row.phenomenonId,
        footTrafficScope: 'COUNTRY',
        footTrafficLocality: row.country,
        culturalScope: 'COUNTRY',
        culturalLocality: row.country,
      },
      update: {},
    });
    report.signals++;
  }

  console.log('[4/7] Copying PhenomenonScore (fanning out per Market)…');
  const srcScores = await src.query<LegacyPhenomenonScore>('SELECT * FROM "PhenomenonScore"');
  report.scoresLegacy = srcScores.rows.length;
  for (const row of srcScores.rows) {
    const targets = marketsByCountry.get(row.country) ?? [];
    if (targets.length === 0) {
      report.scoresSkipped++;
      continue;
    }
    for (const market of targets) {
      const newComposite =
        market.footTrafficAxisWeight * row.compositeScore * 1.0 +
        market.culturalAxisWeight * row.compositeScore * 1.0;
      await db.phenomenonScore.upsert({
        where: {
          phenomenonId_marketId_date: {
            phenomenonId: row.phenomenonId,
            marketId: market.id,
            date: row.date,
          },
        },
        create: {
          phenomenonId: row.phenomenonId,
          marketId: market.id,
          country: row.country,
          date: row.date,
          volume: row.volume,
          velocity: row.velocity,
          acceleration: row.acceleration,
          noiseAdjusted: row.noiseAdjusted,
          sourceDiversity: row.sourceDiversity,
          compositeScore: newComposite,
          footTrafficScore: row.compositeScore,
          culturalScore: row.compositeScore,
          footTrafficProximity: 1.0,
          culturalProximity: 1.0,
          linkBoost: 0,
        },
        update: {},
      });
      report.scoresWritten++;

      const delta = Math.abs(newComposite - row.compositeScore);
      if (delta > 1e-9) {
        report.invariantFailures.push(
          `score ${row.id} market=${market.id}: legacy=${row.compositeScore} new=${newComposite} delta=${delta}`,
        );
      }
      if (delta > report.invariantMaxDelta) report.invariantMaxDelta = delta;
      report.invariantSamples++;
    }
  }

  console.log('[5/7] Copying SignalOfTheDay (fanning out per Market)…');
  const srcSot = await src.query<LegacySignalOfTheDay>('SELECT * FROM "SignalOfTheDay"');
  report.signalOfTheDayLegacy = srcSot.rows.length;
  for (const row of srcSot.rows) {
    const targets = marketsByCountry.get(row.country) ?? [];
    for (const market of targets) {
      await db.signalOfTheDay.upsert({
        where: { marketId_date: { marketId: market.id, date: row.date } },
        create: {
          marketId: market.id,
          country: row.country,
          date: row.date,
          phenomenonIds: row.phenomenonIds,
          narrative: row.narrative,
          publishedAt: row.publishedAt,
        },
        update: {},
      });
      report.signalOfTheDayWritten++;
    }
  }

  console.log('[6/7] Copying PhenomenonFeedback…');
  const srcFeedback = await src.query<LegacyPhenomenonFeedback>('SELECT * FROM "PhenomenonFeedback"');
  for (const row of srcFeedback.rows) {
    await db.phenomenonFeedback.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        phenomenonId: row.phenomenonId,
        userId: row.userId,
        marketId: null,
        verdict: row.verdict,
        interactionKind: 'thumbs',
        note: row.note,
        createdAt: row.createdAt,
      },
      update: {},
    });
    report.feedback++;
  }

  console.log('[7/7] Copying IngestionRun…');
  const srcRuns = await src.query<LegacyIngestionRun>('SELECT * FROM "IngestionRun"');
  for (const row of srcRuns.rows) {
    await db.ingestionRun.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        sourceId: row.sourceId,
        marketId: null,
        startedAt: row.startedAt,
        finishedAt: row.finishedAt,
        status: row.status,
        signalsNew: row.signalsNew,
        signalsSkipped: row.signalsSkipped,
        errorMsg: row.errorMsg,
      },
      update: {},
    });
    report.runs++;
  }

  await src.end();
  await db.$disconnect();

  console.log('\n=== Import report ===');
  console.log(JSON.stringify(report, null, 2));

  if (report.invariantFailures.length > 0) {
    console.error(
      `\nInvariant check FAILED on ${report.invariantFailures.length} rows ` +
        `(max delta ${report.invariantMaxDelta}). Showing first 5:`,
    );
    for (const f of report.invariantFailures.slice(0, 5)) console.error('  ' + f);
    process.exit(1);
  }

  console.log(
    `\nInvariant OK: ${report.invariantSamples} scored rows verified (max delta ${report.invariantMaxDelta}).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
