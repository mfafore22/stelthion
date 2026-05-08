import { prisma } from '../../db/prisma.js';

export interface CorpusDocument {
  id: string;
  phenomenonId: string;
  marketId: string;
  title: string;
  body: string;
  metadata: {
    phenomenonType: string | null;
    lifecycleState: string | null;
    culturalScope: string | null;
    culturalLocality: string | null;
    footTrafficScope: string | null;
    footTrafficLocality: string | null;
    state: string;
    latestCompositeScore: number | null;
    latestScoreDate: string | null;
    firstSeenAt: string;
    lastSignalAt: string;
    eventStart: string | null;
    eventEnd: string | null;
    linkedPhenomenonIds: string[];
  };
}

/**
 * Build a retrievable text document for `phenomenonId` as seen from `marketId`.
 * The document folds narrative, latest metrics, locality, lifecycle, and the
 * link graph into sectioned prose so a downstream embedding store + RAG
 * retriever can return a single coherent chunk per phenomenon. Market-scoped
 * because the score rows we surface are the ones produced for this market's
 * proximity weights — a Helsinki-relevant document for Asuntomessut Lempäälä
 * looks different from Tampere's.
 */
export async function buildCorpusDocument(
  phenomenonId: string,
  marketId: string,
): Promise<CorpusDocument | null> {
  const db = prisma();

  const [phenomenon, scores, linksFrom, linksTo] = await Promise.all([
    db.phenomenon.findUnique({ where: { id: phenomenonId } }),
    db.phenomenonScore.findMany({
      where: { phenomenonId, marketId },
      orderBy: { date: 'desc' },
      take: 7,
    }),
    db.phenomenonLink.findMany({
      where: { fromPhenomenonId: phenomenonId, supersededAt: null },
    }),
    db.phenomenonLink.findMany({
      where: { toPhenomenonId: phenomenonId, supersededAt: null },
    }),
  ]);

  if (!phenomenon) return null;

  const latest = scores[0] ?? null;
  const linkedPhenomenonIds = [
    ...linksFrom.map((l) => l.toPhenomenonId),
    ...linksTo.map((l) => l.fromPhenomenonId),
  ];

  const lines: string[] = [];
  lines.push(`# ${phenomenon.label}`);
  if (phenomenon.description) {
    lines.push('');
    lines.push(phenomenon.description);
  }

  lines.push('');
  lines.push('## Classification');
  lines.push(`- Type: ${phenomenon.phenomenonType ?? 'unknown'}`);
  if (phenomenon.lifecycleState) lines.push(`- Lifecycle: ${phenomenon.lifecycleState}`);
  lines.push(`- State: ${phenomenon.state}`);
  if (phenomenon.eventStart) lines.push(`- Starts: ${phenomenon.eventStart.toISOString()}`);
  if (phenomenon.eventEnd) lines.push(`- Ends: ${phenomenon.eventEnd.toISOString()}`);

  lines.push('');
  lines.push('## Locality');
  lines.push(
    `- Cultural: ${phenomenon.culturalScope ?? 'unknown'} / ${phenomenon.culturalLocality ?? 'unknown'}`,
  );
  lines.push(
    `- Foot traffic: ${phenomenon.footTrafficScope ?? 'unknown'} / ${phenomenon.footTrafficLocality ?? 'unknown'}`,
  );

  if (latest) {
    lines.push('');
    lines.push('## Latest signals');
    lines.push(`- Composite score (as of ${latest.date.toISOString().slice(0, 10)}): ${latest.compositeScore.toFixed(3)}`);
    lines.push(`- Volume: ${latest.volume}, velocity: ${latest.velocity.toFixed(3)}, acceleration: ${latest.acceleration.toFixed(3)}`);
    lines.push(
      `- Foot-traffic component: ${latest.footTrafficScore.toFixed(3)} (proximity ${latest.footTrafficProximity.toFixed(2)})`,
    );
    lines.push(
      `- Cultural component: ${latest.culturalScore.toFixed(3)} (proximity ${latest.culturalProximity.toFixed(2)})`,
    );
    if (latest.linkBoost > 0) lines.push(`- Link-boost contribution: ${latest.linkBoost.toFixed(3)}`);
  }

  if (scores.length > 1) {
    lines.push('');
    lines.push('## Trend over last 7 scored days');
    for (const s of scores) {
      lines.push(`- ${s.date.toISOString().slice(0, 10)}: composite ${s.compositeScore.toFixed(3)}, velocity ${s.velocity.toFixed(3)}`);
    }
  }

  if (linksFrom.length > 0 || linksTo.length > 0) {
    lines.push('');
    lines.push('## Link graph');
    for (const l of linksFrom) {
      lines.push(`- ${l.linkType} → ${l.toPhenomenonId} (weight ${l.weight.toFixed(2)}, inferred by ${l.inferredBy})`);
    }
    for (const l of linksTo) {
      lines.push(`- ${l.fromPhenomenonId} → ${l.linkType} (weight ${l.weight.toFixed(2)}, inferred by ${l.inferredBy})`);
    }
  }

  if (phenomenon.keywords.length > 0) {
    lines.push('');
    lines.push(`## Keywords`);
    lines.push(phenomenon.keywords.join(', '));
  }

  return {
    id: `${marketId}:${phenomenonId}`,
    phenomenonId,
    marketId,
    title: phenomenon.label,
    body: lines.join('\n'),
    metadata: {
      phenomenonType: phenomenon.phenomenonType,
      lifecycleState: phenomenon.lifecycleState,
      culturalScope: phenomenon.culturalScope,
      culturalLocality: phenomenon.culturalLocality,
      footTrafficScope: phenomenon.footTrafficScope,
      footTrafficLocality: phenomenon.footTrafficLocality,
      state: phenomenon.state,
      latestCompositeScore: latest?.compositeScore ?? null,
      latestScoreDate: latest?.date.toISOString() ?? null,
      firstSeenAt: phenomenon.firstSeenAt.toISOString(),
      lastSignalAt: phenomenon.lastSignalAt.toISOString(),
      eventStart: phenomenon.eventStart?.toISOString() ?? null,
      eventEnd: phenomenon.eventEnd?.toISOString() ?? null,
      linkedPhenomenonIds,
    },
  };
}

/**
 * Build corpus documents for every phenomenon that has been scored in this
 * market within the last `sinceDays` days. Used by the RAG chat service to
 * assemble retrieval context, and by the offline embedding rebuild job.
 */
export async function buildCorpusForMarket(
  marketId: string,
  sinceDays: number = 30,
): Promise<CorpusDocument[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  const scored = await prisma().phenomenonScore.findMany({
    where: { marketId, date: { gte: since } },
    select: { phenomenonId: true },
    distinct: ['phenomenonId'],
  });

  const docs: CorpusDocument[] = [];
  for (const row of scored) {
    const doc = await buildCorpusDocument(row.phenomenonId, marketId);
    if (doc) docs.push(doc);
  }
  return docs;
}
