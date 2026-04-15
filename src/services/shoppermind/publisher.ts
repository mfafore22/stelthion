import prisma from '@/app/lib/prisma';
import { generateNarrative } from './prompts';
import { listMarkets } from './markets';

export interface PublishSummary {
  published: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

export async function runPublish(): Promise<PublishSummary> {
  const start = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let published = 0;
  let skipped = 0;
  let errors = 0;

  for (const market of listMarkets()) {
    const existing = await prisma.signalOfTheDay.findUnique({
      where: { country_date: { country: market.country, date: today } },
    });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const topPhenomena = await prisma.phenomenon.findMany({
        where: {
          primaryCountry: market.country,
          mergedInto: null,
          state: { in: ['EMERGING', 'ACCELERATING', 'STABLE'] },
        },
        include: {
          scores: { orderBy: { date: 'desc' }, take: 1 },
        },
        orderBy: { lastSignalAt: 'desc' },
        take: 20,
      });

      const ranked = topPhenomena
        .filter((p) => p.scores.length > 0)
        .map((p) => ({
          id: p.id,
          label: p.label,
          description: p.description,
          compositeScore: p.scores[0].compositeScore,
          state: p.state,
          velocity: p.scores[0].velocity,
        }))
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, 5);

      if (ranked.length === 0) {
        skipped++;
        continue;
      }

      const language = market.country === 'FI' ? 'fi' : 'en';
      const narrative = await generateNarrative(market.country, ranked, language);

      await prisma.signalOfTheDay.create({
        data: {
          country: market.country,
          date: today,
          phenomenonIds: ranked.map((r) => r.id),
          narrative,
        },
      });
      published++;
    } catch (err) {
      console.error(`Failed to publish Signal of the Day for ${market.country}:`, err);
      errors++;
    }
  }

  return { published, skipped, errors, durationMs: Date.now() - start };
}
