import prisma from '@/app/lib/prisma';
import { MARKET_PROFILE, type MarketCountry } from './markets';

interface Weights {
  velocity: number;
  acceleration: number;
  noise: number;
  diversity: number;
}

export async function getWeights(country: string): Promise<Weights> {
  const config = await prisma.shopperMindConfig.findUnique({ where: { country } });
  if (config?.weights) {
    return config.weights as unknown as Weights;
  }
  const profile = MARKET_PROFILE[country as MarketCountry];
  return profile?.weightPriors ?? { velocity: 0.3, acceleration: 0.35, noise: 0.2, diversity: 0.15 };
}

const EMA_ALPHA = 0.1;
const MIN_FEEDBACK_FOR_UPDATE = 10;

export async function recalculateWeights(country: string): Promise<Weights> {
  const current = await getWeights(country);

  const feedback = await prisma.phenomenonFeedback.findMany({
    where: {
      phenomenon: { primaryCountry: country },
    },
    include: {
      phenomenon: {
        include: {
          scores: { orderBy: { date: 'desc' }, take: 1 },
        },
      },
    },
  });

  if (feedback.length < MIN_FEEDBACK_FOR_UPDATE) return current;

  const positive = feedback.filter((f) => f.verdict === 'star' || f.verdict === 'relevant');
  const negative = feedback.filter((f) => f.verdict === 'not_relevant' || f.verdict === 'noise');

  if (positive.length === 0 || negative.length === 0) return current;

  const avgScoreForGroup = (group: typeof feedback) => {
    const scores = group
      .map((f) => f.phenomenon.scores[0])
      .filter(Boolean);
    if (scores.length === 0) return { velocity: 0, acceleration: 0, noiseAdjusted: 0, sourceDiversity: 0 };
    return {
      velocity: scores.reduce((a, s) => a + s.velocity, 0) / scores.length,
      acceleration: scores.reduce((a, s) => a + s.acceleration, 0) / scores.length,
      noiseAdjusted: scores.reduce((a, s) => a + s.noiseAdjusted, 0) / scores.length,
      sourceDiversity: scores.reduce((a, s) => a + s.sourceDiversity, 0) / scores.length,
    };
  };

  const posAvg = avgScoreForGroup(positive);
  const negAvg = avgScoreForGroup(negative);

  const delta = {
    velocity: posAvg.velocity - negAvg.velocity,
    acceleration: posAvg.acceleration - negAvg.acceleration,
    noise: posAvg.noiseAdjusted - negAvg.noiseAdjusted,
    diversity: posAvg.sourceDiversity - negAvg.sourceDiversity,
  };

  const norm = Math.max(
    1,
    Math.abs(delta.velocity) + Math.abs(delta.acceleration) + Math.abs(delta.noise) + Math.abs(delta.diversity),
  );

  const updated: Weights = {
    velocity: Math.max(0.05, current.velocity + EMA_ALPHA * (delta.velocity / norm)),
    acceleration: Math.max(0.05, current.acceleration + EMA_ALPHA * (delta.acceleration / norm)),
    noise: Math.max(0.05, current.noise + EMA_ALPHA * (delta.noise / norm)),
    diversity: Math.max(0.05, current.diversity + EMA_ALPHA * (delta.diversity / norm)),
  };

  const sum = updated.velocity + updated.acceleration + updated.noise + updated.diversity;
  updated.velocity /= sum;
  updated.acceleration /= sum;
  updated.noise /= sum;
  updated.diversity /= sum;

  await prisma.shopperMindConfig.upsert({
    where: { country },
    create: { country, weights: updated as unknown as object },
    update: { weights: updated as unknown as object },
  });

  return updated;
}
