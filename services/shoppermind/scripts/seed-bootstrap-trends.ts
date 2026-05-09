/**
 * Seeds the 2026-q1 trend-bootstrap dataset (services/shoppermind/data/trend-bootstrap/2026-q1/)
 * into the ShopperMind database. Idempotent: re-running updates rows in place.
 *
 * Each Phenomenon carries ≥2 strong (weight ≥ 0.7) cited sources, so the project's
 * composite-source rule (≥2 verified strong sources) is satisfied at seed time.
 * RawSignals are dated 14 days ago (jittered) so live fetchers can naturally
 * supersede them via recencyDecay once they come online.
 *
 * Markets are matched by `country` against keys in BootstrapTrend.marketStatus.
 * The 'EU' key acts as a fallback for any EU-member country that lacks an
 * explicit entry. Markets must already exist (run `prisma db seed` or the
 * existing seed scripts first).
 *
 * Usage (from repo root):
 *   DATABASE_URL=postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db \
 *   npx tsx services/shoppermind/scripts/seed-bootstrap-trends.ts
 */

import { prisma as prismaFactory } from '../src/db/prisma.js';
import { BOOTSTRAP_EPOCH, BOOTSTRAP_TRENDS, type BootstrapState, type BootstrapTrend } from '../data/trend-bootstrap/2026-q1/trends.js';

const prisma = prismaFactory();

const STRONG_WEIGHT = 0.7;
const PROVENANCE_KEYWORD = `bootstrap:${BOOTSTRAP_EPOCH}`;
// Post-Brexit UK is no longer EU politically, but UK retail consumer behaviour
// still tracks the broader European pattern; using the EU fallback keeps UK
// markets populated until trend rows carry an explicit UK column.
const EU_COUNTRIES = new Set(['FI', 'DE', 'FR', 'SE', 'NL', 'IT', 'ES', 'PL', 'BE', 'AT', 'DK', 'IE', 'PT', 'CZ', 'GR', 'HU', 'RO', 'UK']);

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sourceId(name: string): string {
  return `bootstrap-src-${slugify(name)}`;
}

function rawSignalExternalId(trendId: string, sourceIdx: number): string {
  return `bootstrap-${BOOTSTRAP_EPOCH}-${trendId}-${sourceIdx}`;
}

interface ScoreShape {
  velocity: number;
  acceleration: number;
  volume: number;
  composite: number;
}

function scoreForState(state: BootstrapState, jitter: number): ScoreShape {
  const j = (lo: number, hi: number) => lo + (hi - lo) * jitter;
  switch (state) {
    case 'ACCELERATING': return { velocity: j(0.55, 0.7), acceleration: j(0.08, 0.14), volume: Math.round(j(40, 80)), composite: j(0.72, 0.85) };
    case 'EMERGING':    return { velocity: j(0.32, 0.45), acceleration: j(0.04, 0.09), volume: Math.round(j(15, 35)), composite: j(0.55, 0.68) };
    case 'STABLE':      return { velocity: j(0.08, 0.18), acceleration: j(-0.02, 0.02), volume: Math.round(j(25, 50)), composite: j(0.46, 0.58) };
    case 'FADING':      return { velocity: j(-0.18, -0.06), acceleration: j(-0.12, -0.05), volume: Math.round(j(10, 25)), composite: j(0.3, 0.42) };
    case 'DORMANT':     return { velocity: j(-0.05, -0.01), acceleration: j(-0.02, 0.0), volume: Math.round(j(2, 8)), composite: j(0.16, 0.28) };
  }
}

function pickPhenomenonState(t: BootstrapTrend): BootstrapState {
  const primary = t.marketStatus[t.primaryCountry];
  if (primary) return primary;
  const acc = Object.values(t.marketStatus).find((s) => s === 'ACCELERATING');
  return acc ?? 'STABLE';
}

function assertCompositeSourceGate(t: BootstrapTrend): void {
  const strong = t.sources.filter((s) => s.weight >= STRONG_WEIGHT).length;
  if (strong < 2) {
    throw new Error(`Bootstrap trend "${t.id}" has only ${strong} strong source(s) (weight ≥ ${STRONG_WEIGHT}); composite-source gate requires ≥2.`);
  }
}

function jitterFor(seedStr: string): number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

async function main(): Promise<void> {
  console.log(`Seeding trend-bootstrap epoch ${BOOTSTRAP_EPOCH}…\n`);

  for (const t of BOOTSTRAP_TRENDS) assertCompositeSourceGate(t);

  const markets = await prisma.market.findMany({ where: { active: true } });
  if (markets.length === 0) {
    throw new Error('No active markets found. Run the market-seed script first (e.g. registry/seed-markets.json).');
  }
  const marketsByCountry = new Map<string, typeof markets>();
  for (const m of markets) {
    const list = marketsByCountry.get(m.country) ?? [];
    list.push(m);
    marketsByCountry.set(m.country, list);
  }

  // 1. Upsert SignalSource rows (deduped across trends by name).
  const signalSourceIds = new Map<string, string>();
  const allSources = new Map<string, BootstrapTrend['sources'][number]>();
  for (const t of BOOTSTRAP_TRENDS) {
    for (const s of t.sources) {
      if (!allSources.has(s.name)) allSources.set(s.name, s);
    }
  }
  for (const [name, s] of allSources) {
    const id = sourceId(name);
    const language = 'en';
    const country = 'INTL';
    await prisma.signalSource.upsert({
      where: { id },
      update: {
        name,
        url: s.url,
        weight: s.weight,
        active: true,
        config: { bootstrap: BOOTSTRAP_EPOCH, excerpt: s.excerpt },
      },
      create: {
        id,
        name,
        type: 'TRADE_PUB',
        url: s.url,
        country,
        language,
        weight: s.weight,
        active: true,
        config: { bootstrap: BOOTSTRAP_EPOCH, excerpt: s.excerpt },
      },
    });
    signalSourceIds.set(name, id);
  }
  console.log(`  ✓ Upserted ${allSources.size} SignalSource row(s)`);

  // 2. Upsert each Phenomenon + RawSignals + PhenomenonScore rows.
  const now = Date.now();
  const fourteenDaysAgo = (jitterDays: number) => new Date(now - (14 + jitterDays) * 86400000);

  let phenCount = 0;
  let rawSignalCount = 0;
  let scoreCount = 0;

  for (const t of BOOTSTRAP_TRENDS) {
    const state = pickPhenomenonState(t);
    const i18n = {
      en: { label: t.label.en, summary: t.summary.en, mallImpact: t.mallImpact.en, groceryImpact: t.groceryImpact.en },
      fi: { label: t.label.fi, summary: t.summary.fi, mallImpact: t.mallImpact.fi, groceryImpact: t.groceryImpact.fi },
      sv: { label: t.label.sv, summary: t.summary.sv, mallImpact: t.mallImpact.sv, groceryImpact: t.groceryImpact.sv },
    };
    const keywords = Array.from(new Set([...t.keywords, PROVENANCE_KEYWORD, t.domain, ...(t.surprise ? ['surprise'] : [])]));

    await prisma.phenomenon.upsert({
      where: { id: t.id },
      update: {
        label: t.label.en,
        description: t.summary.en,
        primaryCountry: t.primaryCountry,
        categories: [t.domain],
        state,
        keywords,
        i18n,
        phenomenonType: 'TREND',
        lifecycleState: 'ACTIVE',
        lastSignalAt: fourteenDaysAgo(0),
      },
      create: {
        id: t.id,
        label: t.label.en,
        description: t.summary.en,
        primaryCountry: t.primaryCountry,
        categories: [t.domain],
        state,
        keywords,
        centroid: [],
        i18n,
        phenomenonType: 'TREND',
        lifecycleState: 'ACTIVE',
        firstSeenAt: fourteenDaysAgo(7),
        lastSignalAt: fourteenDaysAgo(0),
        culturalScope: 'COUNTRY',
        culturalLocality: t.primaryCountry,
      },
    });
    phenCount++;

    // RawSignals: one per cited source.
    for (let i = 0; i < t.sources.length; i++) {
      const s = t.sources[i];
      const sId = signalSourceIds.get(s.name)!;
      const externalId = rawSignalExternalId(t.id, i);
      await prisma.rawSignal.upsert({
        where: { sourceId_externalId: { sourceId: sId, externalId } },
        update: {
          title: `${t.label.en} — ${s.name}`,
          summary: s.excerpt,
          url: s.url,
          publishedAt: fourteenDaysAgo(i * 2),
          phenomenonId: t.id,
          metadata: { bootstrap: BOOTSTRAP_EPOCH, weight: s.weight },
        },
        create: {
          sourceId: sId,
          externalId,
          title: `${t.label.en} — ${s.name}`,
          summary: s.excerpt,
          url: s.url,
          country: t.primaryCountry,
          language: 'en',
          publishedAt: fourteenDaysAgo(i * 2),
          embedding: [],
          metadata: { bootstrap: BOOTSTRAP_EPOCH, weight: s.weight },
          phenomenonId: t.id,
          culturalScope: 'COUNTRY',
          culturalLocality: t.primaryCountry,
        },
      });
      rawSignalCount++;
    }

    // PhenomenonScore: one per (market, today). Match marketStatus keys to markets by country.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dateOnly = new Date(today.toISOString().split('T')[0]);
    const sourceDiversity = Math.min(1, t.sources.filter((s) => s.weight >= STRONG_WEIGHT).length / 3);

    for (const m of markets) {
      const explicit = t.marketStatus[m.country];
      const fallback = EU_COUNTRIES.has(m.country) ? t.marketStatus['EU'] : undefined;
      const status = explicit ?? fallback;
      if (!status) continue;

      const shape = scoreForState(status, jitterFor(`${t.id}|${m.id}`));
      await prisma.phenomenonScore.upsert({
        where: { phenomenonId_marketId_date: { phenomenonId: t.id, marketId: m.id, date: dateOnly } },
        update: {
          volume: shape.volume,
          velocity: shape.velocity,
          acceleration: shape.acceleration,
          noiseAdjusted: parseFloat((shape.composite - 0.02).toFixed(3)),
          sourceDiversity,
          compositeScore: parseFloat(shape.composite.toFixed(3)),
          footTrafficScore: parseFloat((shape.composite * m.footTrafficAxisWeight).toFixed(3)),
          culturalScore: parseFloat((shape.composite * m.culturalAxisWeight).toFixed(3)),
        },
        create: {
          phenomenonId: t.id,
          marketId: m.id,
          country: m.country,
          date: dateOnly,
          volume: shape.volume,
          velocity: parseFloat(shape.velocity.toFixed(3)),
          acceleration: parseFloat(shape.acceleration.toFixed(3)),
          noiseAdjusted: parseFloat((shape.composite - 0.02).toFixed(3)),
          sourceDiversity,
          compositeScore: parseFloat(shape.composite.toFixed(3)),
          footTrafficScore: parseFloat((shape.composite * m.footTrafficAxisWeight).toFixed(3)),
          culturalScore: parseFloat((shape.composite * m.culturalAxisWeight).toFixed(3)),
          footTrafficProximity: 1.0,
          culturalProximity: 1.0,
          linkBoost: 0,
        },
      });
      scoreCount++;
    }

    console.log(`  ✓ ${t.id} (${state}) — ${t.sources.length} sources, ${[...marketsByCountry.keys()].filter((c) => t.marketStatus[c] || (EU_COUNTRIES.has(c) && t.marketStatus['EU'])).length} markets`);
  }

  console.log(`\n✅ Bootstrap seed complete — ${phenCount} phenomena, ${rawSignalCount} raw signals, ${scoreCount} scores, ${allSources.size} sources.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
