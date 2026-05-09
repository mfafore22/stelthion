// Registers one SignalSource per IMF DataMapper indicator (matches the
// existing FRED/StatFin pattern - per-indicator weight, fetch cadence, and
// active toggle). Sources use marketId: null so they surface as evidence in
// every market. Also seeds a "Global economy in the shadow of war" starter
// phenomenon with one RawSignal per IMF source so it satisfies the
// composite-source rule (>= 2 strong sources) on first display.
//
// Usage (from services/shoppermind/):
//   DATABASE_URL=postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db \
//   REDIS_URL=redis://localhost:56379 \
//   SHOPPERMIND_SERVICE_TOKEN=dev-local-token-0000 \
//   SHOPPERMIND_INTERNAL_TOKEN=dev-internal-token-0000 \
//   npx tsx scripts/seed-imf-source.ts

import { IMF_INDICATORS } from '@stelthion/intelligence-runtime';
import { prisma as prismaFactory } from '../src/db/prisma.js';

const prisma = prismaFactory();

const SOURCE_BLURBS: Record<string, string> = {
  'imf-world-gdp-growth': 'IMF DataMapper - World real GDP growth (NGDP_RPCH/WLD)',
  'imf-world-inflation': 'IMF DataMapper - World CPI inflation (PCPIPCH/WLD)',
  'imf-advanced-inflation': 'IMF DataMapper - Advanced economies inflation (PCPIPCH/ADVEC)',
  'imf-emerging-gdp-growth': 'IMF DataMapper - Emerging markets real GDP growth (NGDP_RPCH/EMDE)',
  'imf-world-debt-gdp': 'IMF DataMapper - World general government gross debt (% of GDP)',
};

const STARTER_PHENOMENON = {
  label: 'Global economy in the shadow of war',
  description:
    'IMF World Economic Outlook themed analysis: growth slowdown driven by geopolitical conflict, energy market disruption, and inflation persistence in advanced economies.',
  primaryCountry: 'GLOBAL',
  categories: ['macro', 'geopolitics', 'inflation', 'growth'],
  keywords: ['imf', 'weo', 'inflation', 'energy', 'war', 'geopolitical', 'sanctions'],
  phenomenonType: 'TREND',
  lifecycleState: 'ACTIVE',
  i18n: {
    fi: {
      label: 'Maailmantalous sodan varjossa',
      description:
        'IMF:n World Economic Outlook -teema: kasvun hidastuminen geopoliittisten konfliktien, energiamarkkinoiden häiriöiden ja inflaation pitkittymisen seurauksena kehittyneissä talouksissa.',
    },
    sv: {
      label: 'Världsekonomin i krigets skugga',
      description:
        'IMF World Economic Outlook-tema: tillväxtinbromsning driven av geopolitisk konflikt, energimarknadsstörningar och ihållande inflation i avancerade ekonomier.',
    },
  },
};

const PHENOMENON_ID = 'imf-global-shadow-of-war';

async function main() {
  await retireRouterSource();

  const sourceIds: string[] = [];
  for (const indicator of IMF_INDICATORS) {
    const url = `https://www.imf.org/external/datamapper/api/v1/${indicator.series}/${indicator.area}`;
    const data = {
      name: SOURCE_BLURBS[indicator.code] ?? indicator.code,
      type: 'IMF' as const,
      url,
      country: 'GLOBAL',
      language: 'en',
      weight: 0.95,
      active: true,
      marketId: null,
      config: { code: indicator.code, series: indicator.series, area: indicator.area },
    };
    const existing = await prisma.signalSource.findFirst({ where: { type: 'IMF', url } });
    const source = existing
      ? await prisma.signalSource.update({ where: { id: existing.id }, data })
      : await prisma.signalSource.create({ data: { ...data, nextFetchAt: new Date() } });
    sourceIds.push(source.id);
    console.log(`${existing ? '↻' : '+'} IMF source ${indicator.code}: ${source.id}`);
  }

  const existingPhenomenon = await prisma.phenomenon.findUnique({ where: { id: PHENOMENON_ID } });
  if (existingPhenomenon) {
    await prisma.phenomenon.update({ where: { id: PHENOMENON_ID }, data: STARTER_PHENOMENON });
    console.log(`↻ Phenomenon: ${PHENOMENON_ID}`);
  } else {
    await prisma.phenomenon.create({ data: { id: PHENOMENON_ID, ...STARTER_PHENOMENON } });
    console.log(`+ Phenomenon: ${PHENOMENON_ID}`);
  }

  for (let i = 0; i < IMF_INDICATORS.length; i++) {
    const indicator = IMF_INDICATORS[i];
    const sourceId = sourceIds[i];
    if (!indicator || !sourceId) continue;
    const externalId = `imf-weo-shadow-of-war:${indicator.code}`;
    const signal = await prisma.rawSignal.upsert({
      where: { sourceId_externalId: { sourceId, externalId } },
      update: {
        title: `${STARTER_PHENOMENON.label} (${indicator.series}/${indicator.area})`,
        summary: STARTER_PHENOMENON.description,
        phenomenonId: PHENOMENON_ID,
        country: 'GLOBAL',
        language: 'en',
        publishedAt: new Date('2024-10-01T00:00:00Z'),
      },
      create: {
        sourceId,
        externalId,
        title: `${STARTER_PHENOMENON.label} (${indicator.series}/${indicator.area})`,
        summary: STARTER_PHENOMENON.description,
        url: 'https://www.imf.org/en/Publications/WEO',
        country: 'GLOBAL',
        language: 'en',
        publishedAt: new Date('2024-10-01T00:00:00Z'),
        phenomenonId: PHENOMENON_ID,
        embedding: [],
      },
    });
    console.log(`+ Signal ${indicator.code}: ${signal.id}`);
  }

  await prisma.$disconnect();
}

async function retireRouterSource(): Promise<void> {
  const router = await prisma.signalSource.findFirst({
    where: { type: 'IMF', url: 'https://www.imf.org/external/datamapper/api/v1' },
  });
  if (!router) return;
  await prisma.rawSignal.deleteMany({ where: { sourceId: router.id } });
  await prisma.signalSource.delete({ where: { id: router.id } });
  console.log(`- Retired router source: ${router.id}`);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
