/**
 * Phase 1 regression harness: asserts the ShopperMind v2 service reproduces
 * the legacy FI + AE SignalOfTheDay output for a 7-day window, byte-equal
 * on phenomenonIds + narrative.
 *
 * Pre-conditions:
 *   - import-legacy-data.ts has been run against shoppermind_db.
 *   - The seed-markets.json mapping (FI → helsinki-fi, AE → dubai-ae) is
 *     current; non-default axis weights would break the bit-identical
 *     composite-score invariant so the harness checks that too.
 *
 * Usage:
 *   SOURCE_DATABASE_URL=postgres://... \
 *   DATABASE_URL=postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db \
 *   tsx services/shoppermind/scripts/regression-harness.ts
 */

import pg from 'pg';
import { prisma } from '../src/db/prisma.js';
import { loadMarket } from '../src/engine/registry/market-registry.js';

interface LegacySotdRow {
  country: string;
  date: Date;
  phenomenonIds: string[];
  narrative: string;
}

interface Mismatch {
  kind: 'missing' | 'phenomenonIds' | 'narrative' | 'axis_weights' | 'composite_invariant';
  marketId: string;
  date?: string;
  detail: string;
}

const COUNTRY_TO_MARKET: Record<string, string> = {
  FI: 'helsinki-fi',
  AE: 'dubai-ae',
};

const WINDOW_DAYS = 7;

async function main() {
  const src = new pg.Client({ connectionString: process.env.SOURCE_DATABASE_URL });
  await src.connect();
  const db = prisma();

  const mismatches: Mismatch[] = [];
  let comparedDays = 0;

  for (const [country, marketId] of Object.entries(COUNTRY_TO_MARKET)) {
    const market = await loadMarket(marketId);
    if (!market) {
      mismatches.push({ kind: 'missing', marketId, detail: `Market ${marketId} not found` });
      continue;
    }
    if (market.footTrafficAxisWeight + market.culturalAxisWeight !== 1.0) {
      mismatches.push({
        kind: 'axis_weights',
        marketId,
        detail: `axisWeights sum=${market.footTrafficAxisWeight + market.culturalAxisWeight} (expected 1.0 for bit-identical invariant)`,
      });
    }

    const legacy = await src.query<LegacySotdRow>(
      `SELECT country, date, "phenomenonIds", narrative
         FROM "SignalOfTheDay"
        WHERE country = $1
        ORDER BY date DESC
        LIMIT $2`,
      [country, WINDOW_DAYS],
    );

    for (const row of legacy.rows) {
      comparedDays++;
      const dateIso = row.date.toISOString().slice(0, 10);
      const target = await db.signalOfTheDay.findUnique({
        where: { marketId_date: { marketId, date: row.date } },
      });
      if (!target) {
        mismatches.push({
          kind: 'missing',
          marketId,
          date: dateIso,
          detail: 'No SignalOfTheDay row in target for this (marketId, date)',
        });
        continue;
      }
      const legacyIds = [...row.phenomenonIds].sort();
      const targetIds = [...target.phenomenonIds].sort();
      if (legacyIds.length !== targetIds.length || legacyIds.some((id, i) => id !== targetIds[i])) {
        mismatches.push({
          kind: 'phenomenonIds',
          marketId,
          date: dateIso,
          detail: `legacy=[${legacyIds.join(',')}] target=[${targetIds.join(',')}]`,
        });
      }
      if (row.narrative !== target.narrative) {
        mismatches.push({
          kind: 'narrative',
          marketId,
          date: dateIso,
          detail: `narrative differs (len ${row.narrative.length} vs ${target.narrative.length})`,
        });
      }
    }
  }

  console.log('[composite invariant] spot-checking PhenomenonScore rows…');
  const invariantSamples = await src.query<{
    phenomenonId: string;
    country: string;
    date: Date;
    compositeScore: number;
  }>(
    `SELECT "phenomenonId", country, date, "compositeScore"
       FROM "PhenomenonScore"
      WHERE country = ANY($1::text[])
      ORDER BY date DESC
      LIMIT 500`,
    [Object.keys(COUNTRY_TO_MARKET)],
  );
  let maxDelta = 0;
  let invariantChecked = 0;
  for (const s of invariantSamples.rows) {
    const marketId = COUNTRY_TO_MARKET[s.country];
    if (!marketId) continue;
    const target = await db.phenomenonScore.findUnique({
      where: {
        phenomenonId_marketId_date: {
          phenomenonId: s.phenomenonId,
          marketId,
          date: s.date,
        },
      },
    });
    if (!target) {
      mismatches.push({
        kind: 'composite_invariant',
        marketId,
        date: s.date.toISOString().slice(0, 10),
        detail: `score for ${s.phenomenonId} missing in target`,
      });
      continue;
    }
    const delta = Math.abs(target.compositeScore - s.compositeScore);
    if (delta > maxDelta) maxDelta = delta;
    if (delta > 1e-9) {
      mismatches.push({
        kind: 'composite_invariant',
        marketId,
        date: s.date.toISOString().slice(0, 10),
        detail: `composite drifted: legacy=${s.compositeScore} target=${target.compositeScore} delta=${delta}`,
      });
    }
    invariantChecked++;
  }

  await src.end();
  await db.$disconnect();

  console.log('\n=== Regression harness ===');
  console.log(`  SOT days compared:      ${comparedDays}`);
  console.log(`  invariant rows checked: ${invariantChecked}`);
  console.log(`  max composite delta:    ${maxDelta}`);
  console.log(`  mismatches:             ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.error('\nMismatches (first 20):');
    for (const m of mismatches.slice(0, 20)) {
      console.error(`  [${m.kind}] market=${m.marketId} date=${m.date ?? '—'}: ${m.detail}`);
    }
    process.exit(1);
  }
  console.log('\nPASS: 7-day SignalOfTheDay parity + composite-score invariant hold.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
