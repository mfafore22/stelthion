import { prisma } from '../../db/prisma.js';

export interface HistoricalManifestation {
  phenomenonId: string;
  label: string;
  type: 'EVENT' | 'CAMPAIGN';
  eventStart: Date;
  eventEnd: Date | null;
  linkType: 'MANIFESTATION_OF' | 'PRECEDES' | 'CONTRIBUTES_TO';
  linkWeight: number;
}

export interface PredictedEvent {
  trendId: string;
  trendLabel: string;
  basisCount: number;
  cadenceDays: number;
  cadenceStability: number;
  expectedStart: string;
  expectedEnd: string | null;
  confidence: number;
  rationale: string;
}

interface TrendInput {
  id: string;
  label: string;
  phenomenonType: string | null;
}

const MIN_BASIS = 2;
const MAX_CADENCE_COEF_OF_VARIATION = 0.25;

/**
 * Given a trend and the set of historical events/campaigns that have been
 * marked as manifestations of (or precedents for) it, infer the next expected
 * instance. Pure function — no I/O — so the prediction logic is trivially
 * testable.
 *
 * The algorithm: sort manifestations by eventStart, compute the deltas
 * between consecutive starts, and if those deltas are consistent within a
 * tolerance (coefficient of variation under `MAX_CADENCE_COEF_OF_VARIATION`),
 * project the next slot using the mean delta. Confidence scales with basis
 * count, cadence stability, and the average link weight.
 */
export function predictNextInstance(
  trend: TrendInput,
  manifestations: HistoricalManifestation[],
  now: Date = new Date(),
): PredictedEvent | null {
  if (trend.phenomenonType !== 'TREND') return null;

  const usable = manifestations
    .filter(
      (m) =>
        m.linkType === 'MANIFESTATION_OF' || m.linkType === 'PRECEDES',
    )
    .filter((m) => m.eventStart instanceof Date && !Number.isNaN(m.eventStart.getTime()))
    .sort((a, b) => a.eventStart.getTime() - b.eventStart.getTime());

  if (usable.length < MIN_BASIS) return null;

  const deltas: number[] = [];
  for (let i = 1; i < usable.length; i++) {
    const delta =
      (usable[i].eventStart.getTime() - usable[i - 1].eventStart.getTime()) /
      (24 * 60 * 60 * 1000);
    if (delta > 0) deltas.push(delta);
  }
  if (deltas.length === 0) return null;

  const meanCadence = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  if (meanCadence < 1) return null;

  const variance =
    deltas.reduce((sum, d) => sum + (d - meanCadence) ** 2, 0) / deltas.length;
  const stdDev = Math.sqrt(variance);
  const cov = meanCadence === 0 ? Infinity : stdDev / meanCadence;
  if (cov > MAX_CADENCE_COEF_OF_VARIATION) return null;

  const lastInstance = usable[usable.length - 1];
  const lastEndMs = (lastInstance.eventEnd ?? lastInstance.eventStart).getTime();
  const durationMs =
    lastInstance.eventEnd
      ? lastInstance.eventEnd.getTime() - lastInstance.eventStart.getTime()
      : null;

  const expectedStartMs =
    lastInstance.eventStart.getTime() + meanCadence * 24 * 60 * 60 * 1000;
  if (expectedStartMs <= now.getTime() && expectedStartMs <= lastEndMs) {
    return null;
  }

  const cadenceStability = Math.max(0, Math.min(1, 1 - cov / MAX_CADENCE_COEF_OF_VARIATION));
  const basisFactor = Math.min(1, usable.length / 4);
  const linkWeightAvg =
    usable.reduce((sum, m) => sum + m.linkWeight, 0) / usable.length;
  const confidence = Number(
    (cadenceStability * 0.5 + basisFactor * 0.3 + linkWeightAvg * 0.2).toFixed(3),
  );

  const expectedStart = new Date(expectedStartMs);
  const expectedEnd = durationMs ? new Date(expectedStartMs + durationMs) : null;

  const cadenceLabel =
    meanCadence >= 350 && meanCadence <= 380
      ? 'annual'
      : meanCadence >= 85 && meanCadence <= 95
        ? 'quarterly'
        : meanCadence >= 28 && meanCadence <= 32
          ? 'monthly'
          : `${Math.round(meanCadence)}-day`;

  return {
    trendId: trend.id,
    trendLabel: trend.label,
    basisCount: usable.length,
    cadenceDays: Number(meanCadence.toFixed(1)),
    cadenceStability: Number(cadenceStability.toFixed(3)),
    expectedStart: expectedStart.toISOString(),
    expectedEnd: expectedEnd ? expectedEnd.toISOString() : null,
    confidence,
    rationale: `${usable.length} historical ${cadenceLabel} instances; last at ${lastInstance.eventStart.toISOString().slice(0, 10)}.`,
  };
}

/**
 * DB-backed resolver. Loads the trend + its inbound MANIFESTATION_OF /
 * PRECEDES links (from EVENTs and CAMPAIGNs), hands them to the pure
 * predictor. Returns null if the phenomenon is not a TREND or no
 * prediction is warranted.
 */
export async function predictForTrend(
  trendId: string,
  now: Date = new Date(),
): Promise<PredictedEvent | null> {
  const trend = await prisma().phenomenon.findUnique({
    where: { id: trendId },
    select: { id: true, label: true, phenomenonType: true },
  });
  if (!trend || trend.phenomenonType !== 'TREND') return null;

  // Inbound links: EVENT/CAMPAIGN ──MANIFESTATION_OF/PRECEDES──▶ TREND
  const links = await prisma().phenomenonLink.findMany({
    where: {
      toPhenomenonId: trendId,
      linkType: { in: ['MANIFESTATION_OF', 'PRECEDES'] },
      supersededAt: null,
    },
    include: {
      from: {
        select: {
          id: true,
          label: true,
          phenomenonType: true,
          eventStart: true,
          eventEnd: true,
        },
      },
    },
  });

  const manifestations: HistoricalManifestation[] = links
    .filter(
      (l) =>
        (l.from.phenomenonType === 'EVENT' || l.from.phenomenonType === 'CAMPAIGN') &&
        l.from.eventStart !== null,
    )
    .map((l) => ({
      phenomenonId: l.from.id,
      label: l.from.label,
      type: l.from.phenomenonType as 'EVENT' | 'CAMPAIGN',
      eventStart: l.from.eventStart as Date,
      eventEnd: l.from.eventEnd,
      linkType: l.linkType as 'MANIFESTATION_OF' | 'PRECEDES',
      linkWeight: l.weight,
    }));

  return predictNextInstance(trend, manifestations, now);
}
