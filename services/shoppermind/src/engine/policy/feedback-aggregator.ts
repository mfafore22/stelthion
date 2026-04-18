import { prisma } from '../../db/prisma.js';

const POSITIVE_VERDICTS = new Set(['relevant', 'star', 'thumbs_up', 'up', 'positive']);
const NEGATIVE_VERDICTS = new Set([
  'not_relevant',
  'noise',
  'thumbs_down',
  'down',
  'negative',
]);

export interface FeedbackCounts {
  positive: number;
  negative: number;
}

/**
 * Aggregate recent PhenomenonFeedback for a phenomenon in a market into
 * positive/negative counts that feed the policy engine's feedback-aware shift.
 * Market-scoped rows take precedence; rows without a marketId are counted too
 * (older feedback pre-dates the marketId column).
 */
export async function getFeedbackCounts(
  phenomenonId: string,
  marketId: string,
  windowDays: number,
  now: Date = new Date(),
): Promise<FeedbackCounts> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await prisma().phenomenonFeedback.findMany({
    where: {
      phenomenonId,
      createdAt: { gte: since },
      OR: [{ marketId }, { marketId: null }],
    },
    select: { verdict: true },
  });

  let positive = 0;
  let negative = 0;
  for (const row of rows) {
    if (POSITIVE_VERDICTS.has(row.verdict)) positive++;
    else if (NEGATIVE_VERDICTS.has(row.verdict)) negative++;
  }
  return { positive, negative };
}
