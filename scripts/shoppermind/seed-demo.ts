/**
 * Demo seed for ShopperMind — populates Phenomena, 28-day scores and a
 * SignalOfTheDay for FI (retail) and AE (property) so both the
 * /mall/shoppermind dashboard and the concierge trends tool render
 * realistic content before the real ingestion pipeline has run.
 *
 * Idempotent: wipes and re-creates demo rows keyed by the label prefix
 * "[demo]".
 *
 * Usage: npx tsx scripts/shoppermind/seed-demo.ts
 */
import { PrismaClient, PhenomenonState } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it before running this script.');
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface DemoPhenomenon {
  label: string;
  description: string;
  categories: string[];
  keywords: string[];
  state: PhenomenonState;
  baseVolume: number;   // volume 28d ago
  finalVolume: number;  // volume today
  sources: number;      // distinct sources
}

const FI_PHENOMENA: DemoPhenomenon[] = [
  {
    label: '[demo] Käytetyn luksuksen kasvu Tampereella',
    description: 'Käytettyä luksusta myyvät liikkeet ja komissiomyyntikonseptit raportoivat 2–3-kertaisista asiakasmääristä ja vuokratiedusteluista Pirkanmaalla.',
    categories: ['fashion', 'retail-tenancy'],
    keywords: ['käytetty', 'vintage', 'luksus', 'Tampere'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 4, finalVolume: 38, sources: 6,
  },
  {
    label: '[demo] Viipymäaika pitenee kahvila-ankkureiden ansiosta',
    description: 'Ravintola- ja kahvilavetoiset ankkurivaihdot (erikoiskahvit, brunssikonseptit) korreloivat 15–20 minuutin viipymäajan kasvun kanssa pohjoismaisissa kauppakeskuksissa.',
    categories: ['f&b', 'footfall-driver'],
    keywords: ['kahvi', 'viipymä', 'brunssi', 'ankkuri'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 6, finalVolume: 44, sources: 8,
  },
  {
    label: '[demo] Nuorten muotibrändit vetäytyvät keskustoista',
    description: 'Suomalaiset nuorten muotibrändit keskittyvät alueellisiin kauppakeskuksiin samalla kun keskustakivijalkaliikkeitä suljetaan; signaalit viittaavat kauppakeskusformaattiin.',
    categories: ['fashion', 'retail-tenancy'],
    keywords: ['nuoret', 'keskusta', 'sulkemiset', 'kauppakeskus'],
    state: PhenomenonState.EMERGING,
    baseVolume: 2, finalVolume: 18, sources: 5,
  },
  {
    label: '[demo] Nouto- ja toimituspalveluiden kyllästyminen päivittäistavarassa',
    description: 'Suomalaiset ruokakauppatoimijat raportoivat noutopalveluiden volyymien tasaantumisesta verrattuna vuoteen 2024; ostoskorit elpyvät myymälöissä.',
    categories: ['grocery', 'services'],
    keywords: ['nouto', 'päivittäistavara', 'Kesko', 'S-ryhmä'],
    state: PhenomenonState.STABLE,
    baseVolume: 22, finalVolume: 20, sources: 7,
  },
  {
    label: '[demo] Pikamuodin pop-up-konseptit hiipuvat',
    description: 'Lyhytvuokraisten pikamuodin pop-up-liikkeiden signaalivolyymi ja liikemäärä laskevat vuositasolla pohjoismaisessa kiinteistöalan mediassa.',
    categories: ['fashion', 'retail-tenancy'],
    keywords: ['pop-up', 'pikamuoti', 'vuokra'],
    state: PhenomenonState.FADING,
    baseVolume: 24, finalVolume: 9, sources: 4,
  },
  {
    label: '[demo] Hyvinvointikonseptit ruokakaupan ankkureiksi',
    description: 'Sauna-, palautumis- ja hyvinvointikonseptit nousevat toissijaisiksi ankkureiksi päivittäistavaran rinnalle suomalaisissa kauppakeskuksissa.',
    categories: ['health-beauty', 'leisure', 'retail-tenancy'],
    keywords: ['hyvinvointi', 'sauna', 'palautuminen', 'ankkuri'],
    state: PhenomenonState.EMERGING,
    baseVolume: 3, finalVolume: 22, sources: 6,
  },
];

const AE_PHENOMENA: DemoPhenomenon[] = [
  {
    label: '[demo] Off-plan Dubai Marina transactions accelerating',
    description: 'Primary-market Dubai Marina launches showing sustained velocity in off-plan volumes; secondary listings tightening in parallel.',
    categories: ['residential-sale', 'mixed-use'],
    keywords: ['off-plan', 'Dubai Marina', 'launch', 'primary'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 8, finalVolume: 52, sources: 9,
  },
  {
    label: '[demo] DIFC office demand rising on fintech inflows',
    description: 'Grade-A DIFC office absorption tracked upward as fintech and crypto licensees expand; sublease availability tightening.',
    categories: ['commercial-office'],
    keywords: ['DIFC', 'fintech', 'office', 'Grade A'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 5, finalVolume: 36, sources: 7,
  },
  {
    label: '[demo] JVC rental yield compression',
    description: 'Jumeirah Village Circle yields compressing as capital values outrun rent growth; investor sentiment trade press watching closely.',
    categories: ['residential-rental', 'residential-sale'],
    keywords: ['JVC', 'yield', 'rental', 'compression'],
    state: PhenomenonState.EMERGING,
    baseVolume: 3, finalVolume: 19, sources: 5,
  },
  {
    label: '[demo] Expo-legacy district footfall patterns',
    description: 'Expo City Dubai and surrounding districts showing distinct weekend vs. weekday footfall patterns as mixed-use tenancy matures.',
    categories: ['mixed-use', 'commercial-retail'],
    keywords: ['Expo City', 'footfall', 'district', 'legacy'],
    state: PhenomenonState.STABLE,
    baseVolume: 14, finalVolume: 16, sources: 6,
  },
  {
    label: '[demo] Short-term rental supply plateauing',
    description: 'Dubai STR listings growth decelerating after multi-year expansion; DET licensing cadence slower than 2024.',
    categories: ['short-term-rental', 'hospitality'],
    keywords: ['STR', 'holiday home', 'DET', 'Airbnb'],
    state: PhenomenonState.FADING,
    baseVolume: 28, finalVolume: 12, sources: 4,
  },
  {
    label: '[demo] RevPAR surge around DP World events',
    description: 'Hospitality RevPAR around major DP World-linked exhibitions outpacing non-event weeks by 35–45%; hotel pipeline adjusting.',
    categories: ['hospitality', 'tourism'],
    keywords: ['RevPAR', 'DP World', 'hotel', 'events'],
    state: PhenomenonState.ACCELERATING,
    baseVolume: 4, finalVolume: 29, sources: 6,
  },
];

function buildScoreSeries(d: DemoPhenomenon): Array<{
  date: Date;
  volume: number;
  velocity: number;
  acceleration: number;
  noiseAdjusted: number;
  sourceDiversity: number;
  compositeScore: number;
}> {
  const rows: ReturnType<typeof buildScoreSeries> = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Shape: linear interpolation from base to final, with small noise.
  const span = 28;
  const volumes: number[] = [];
  for (let i = 0; i < span; i++) {
    const t = i / (span - 1);
    const lin = d.baseVolume + (d.finalVolume - d.baseVolume) * t;
    const jitter = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * Math.max(1, lin * 0.08);
    volumes.push(Math.max(0, Math.round(lin + jitter)));
  }

  // Compute velocity/acceleration from 7-day moving average.
  const ma7 = (idx: number) => {
    const start = Math.max(0, idx - 6);
    const slice = volumes.slice(start, idx + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  };

  for (let i = 0; i < span; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (span - 1 - i));

    const velocity = i > 0 ? volumes[i] - ma7(i - 1) : 0;
    const prevVel = i > 1 ? volumes[i - 1] - ma7(i - 2) : 0;
    const acceleration = velocity - prevVel;
    const mean = volumes.reduce((s, v) => s + v, 0) / volumes.length;
    const mad = volumes.reduce((s, v) => s + Math.abs(v - mean), 0) / volumes.length || 1;
    const noiseAdjusted = volumes[i] / mad;
    const sourceDiversity = Math.min(1, d.sources / Math.max(1, volumes[i]));
    const composite =
      0.35 * clamp((velocity + 10) / 20) +
      0.30 * clamp((acceleration + 10) / 20) +
      0.20 * clamp(noiseAdjusted / 5) +
      0.15 * sourceDiversity;

    rows.push({
      date,
      volume: volumes[i],
      velocity: round(velocity),
      acceleration: round(acceleration),
      noiseAdjusted: round(noiseAdjusted),
      sourceDiversity: round(sourceDiversity),
      compositeScore: round(composite),
    });
  }
  return rows;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}
function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

async function wipeDemo() {
  // Delete demo scores first via cascade on phenomenon deletion.
  const demoPhenomena = await prisma.phenomenon.findMany({
    where: { label: { startsWith: '[demo]' } },
    select: { id: true },
  });
  const ids = demoPhenomena.map((p) => p.id);
  if (ids.length) {
    await prisma.phenomenonScore.deleteMany({ where: { phenomenonId: { in: ids } } });
    await prisma.phenomenon.deleteMany({ where: { id: { in: ids } } });
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.signalOfTheDay.deleteMany({
    where: { narrative: { startsWith: '[demo]' } },
  });
}

async function seedCountry(country: string, phenomena: DemoPhenomenon[]) {
  const createdIds: string[] = [];

  for (const d of phenomena) {
    const phen = await prisma.phenomenon.create({
      data: {
        label: d.label,
        description: d.description,
        primaryCountry: country,
        categories: d.categories,
        keywords: d.keywords,
        state: d.state,
        firstSeenAt: (() => { const dt = new Date(); dt.setUTCDate(dt.getUTCDate() - 28); return dt; })(),
        lastSignalAt: new Date(),
      },
    });
    createdIds.push(phen.id);

    const scores = buildScoreSeries(d).map((s) => ({
      ...s,
      phenomenonId: phen.id,
      country,
    }));
    await prisma.phenomenonScore.createMany({ data: scores, skipDuplicates: true });
  }

  // Pick top 3 by final composite for SignalOfTheDay.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const latestScores = await prisma.phenomenonScore.findMany({
    where: { phenomenonId: { in: createdIds }, date: today },
    orderBy: { compositeScore: 'desc' },
    take: 3,
  });
  const featured = latestScores.map((s) => s.phenomenonId);
  const featuredPhenomena = await prisma.phenomenon.findMany({
    where: { id: { in: featured } },
    select: { label: true, description: true, state: true },
  });
  const stateLabelFi: Record<string, string> = {
    ACCELERATING: 'kiihtyvä',
    EMERGING: 'nouseva',
    STABLE: 'vakaa',
    FADING: 'hiipuva',
    DORMANT: 'lepotilassa',
  };
  const bullets = featuredPhenomena
    .map((p) => {
      const label = p.label.replace('[demo] ', '');
      const stateLabel = country === 'FI'
        ? stateLabelFi[p.state] ?? p.state.toLowerCase()
        : p.state.toLowerCase();
      return `• ${label} (${stateLabel}): ${p.description}`;
    })
    .join('\n');
  const narrative = country === 'FI'
    ? `[demo] Päivän signaali — Vähittäiskauppa, Suomi\n\nKolme seurattavaa ilmiötä tällä viikolla:\n\n${bullets}`
    : `[demo] Signal of the Day — Property industry, UAE\n\nTop three phenomena to watch this week:\n\n${bullets}`;

  await prisma.signalOfTheDay.upsert({
    where: { country_date: { country, date: today } },
    create: {
      country,
      date: today,
      phenomenonIds: featured,
      narrative,
    },
    update: { phenomenonIds: featured, narrative },
  });

  console.log(`  ${country}: ${createdIds.length} phenomena, ${latestScores.length} featured in SignalOfTheDay`);
}

async function main() {
  console.log('Wiping existing demo rows…');
  await wipeDemo();
  console.log('Seeding FI (retail)…');
  await seedCountry('FI', FI_PHENOMENA);
  console.log('Seeding AE (property)…');
  await seedCountry('AE', AE_PHENOMENA);
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
