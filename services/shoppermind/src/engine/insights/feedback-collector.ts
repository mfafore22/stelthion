import { prisma } from '../../db/prisma.js';

export const INTERACTION_KINDS = [
  'thumbs',
  'click',
  'dwell',
  'chat_followup',
  'chat_citation_click',
] as const;

export type InteractionKind = (typeof INTERACTION_KINDS)[number];

export interface RecordInteractionInput {
  phenomenonId: string;
  userId: string;
  marketId?: string;
  interactionKind: InteractionKind;
  verdict: string;
  note?: string;
}

export interface InteractionRecord {
  id: string;
  phenomenonId: string;
  marketId: string | null;
  userId: string;
  interactionKind: string;
  verdict: string;
  note: string | null;
  createdAt: string;
}

/**
 * Capture a customer-facing interaction against a phenomenon. Kinds cover:
 * - thumbs: explicit verdict (relevant / not_relevant / star / noise)
 * - click: the user opened this phenomenon from a list or signal-of-day
 * - dwell: time-on-page threshold crossed (verdict encodes duration bucket)
 * - chat_followup: user asked a follow-up question grounded on this phenomenon
 * - chat_citation_click: user clicked a bracketed citation in a chat answer
 *
 * All rows land in PhenomenonFeedback and feed weight recalculation plus the
 * offline training export. Feedback is market-scoped when the caller supplies
 * marketId so a Helsinki thumbs-down doesn't pollute Tampere's gate signal.
 */
export async function recordInteraction(
  input: RecordInteractionInput,
): Promise<InteractionRecord> {
  const row = await prisma().phenomenonFeedback.create({
    data: {
      phenomenonId: input.phenomenonId,
      userId: input.userId,
      marketId: input.marketId ?? null,
      interactionKind: input.interactionKind,
      verdict: input.verdict,
      note: input.note ?? null,
    },
  });
  return {
    id: row.id,
    phenomenonId: row.phenomenonId,
    marketId: row.marketId ?? null,
    userId: row.userId,
    interactionKind: row.interactionKind,
    verdict: row.verdict,
    note: row.note ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface InteractionSummary {
  phenomenonId: string;
  marketId: string | null;
  windowDays: number;
  totals: {
    thumbsUp: number;
    thumbsDown: number;
    clicks: number;
    dwellEvents: number;
    chatFollowups: number;
    citationClicks: number;
  };
}

const POSITIVE = new Set(['relevant', 'star', 'thumbs_up', 'up', 'positive']);
const NEGATIVE = new Set(['not_relevant', 'noise', 'thumbs_down', 'down', 'negative']);

/**
 * Roll up interactions for a phenomenon into per-kind totals over the last
 * `windowDays` days. Drives the admin dashboard and the feedback-aware policy
 * modifier's observable surface (what the gate saw vs what the UI shows).
 */
export async function summariseInteractions(
  phenomenonId: string,
  marketId: string | undefined,
  windowDays: number,
  now: Date = new Date(),
): Promise<InteractionSummary> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await prisma().phenomenonFeedback.findMany({
    where: {
      phenomenonId,
      createdAt: { gte: since },
      ...(marketId ? { OR: [{ marketId }, { marketId: null }] } : {}),
    },
    select: { interactionKind: true, verdict: true },
  });

  const totals = {
    thumbsUp: 0,
    thumbsDown: 0,
    clicks: 0,
    dwellEvents: 0,
    chatFollowups: 0,
    citationClicks: 0,
  };

  for (const r of rows) {
    switch (r.interactionKind) {
      case 'thumbs':
        if (POSITIVE.has(r.verdict)) totals.thumbsUp++;
        else if (NEGATIVE.has(r.verdict)) totals.thumbsDown++;
        break;
      case 'click':
        totals.clicks++;
        break;
      case 'dwell':
        totals.dwellEvents++;
        break;
      case 'chat_followup':
        totals.chatFollowups++;
        break;
      case 'chat_citation_click':
        totals.citationClicks++;
        break;
    }
  }

  return { phenomenonId, marketId: marketId ?? null, windowDays, totals };
}

export interface ListFeedbackFilters {
  phenomenonId?: string;
  userId?: string;
  verdict?: string;
  marketId?: string;
  since?: Date;
  limit: number;
}

export interface FeedbackListRow {
  id: string;
  phenomenonId: string;
  phenomenonLabel: string;
  userId: string;
  marketId: string | null;
  interactionKind: string;
  verdict: string;
  note: string | null;
  createdAt: string;
}

export interface FeedbackListAggregate {
  phenomenonId: string;
  phenomenonLabel: string;
  relevant: number;
  notRelevant: number;
  commentCount: number;
}

export interface FeedbackListResult {
  rows: FeedbackListRow[];
  aggregates: FeedbackListAggregate[];
}

/**
 * List feedback rows for the admin review surface plus per-phenomenon
 * aggregates over the same filtered set. Joins each row with the
 * phenomenon so the admin can read trend labels without a second query.
 */
export async function listFeedback(filters: ListFeedbackFilters): Promise<FeedbackListResult> {
  const where: Record<string, unknown> = {};
  if (filters.phenomenonId) where.phenomenonId = filters.phenomenonId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.verdict) where.verdict = filters.verdict;
  if (filters.marketId) where.marketId = filters.marketId;
  if (filters.since) where.createdAt = { gte: filters.since };

  const rawRows = await prisma().phenomenonFeedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
    include: { phenomenon: { select: { label: true } } },
  });

  const rows: FeedbackListRow[] = rawRows.map((r) => ({
    id: r.id,
    phenomenonId: r.phenomenonId,
    phenomenonLabel: r.phenomenon?.label ?? r.phenomenonId,
    userId: r.userId,
    marketId: r.marketId ?? null,
    interactionKind: r.interactionKind,
    verdict: r.verdict,
    note: r.note ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  const aggMap = new Map<string, FeedbackListAggregate>();
  for (const r of rows) {
    let agg = aggMap.get(r.phenomenonId);
    if (!agg) {
      agg = {
        phenomenonId: r.phenomenonId,
        phenomenonLabel: r.phenomenonLabel,
        relevant: 0,
        notRelevant: 0,
        commentCount: 0,
      };
      aggMap.set(r.phenomenonId, agg);
    }
    if (POSITIVE.has(r.verdict)) agg.relevant++;
    else if (NEGATIVE.has(r.verdict)) agg.notRelevant++;
    if (r.note && r.note.trim().length > 0) agg.commentCount++;
  }

  return { rows, aggregates: [...aggMap.values()] };
}
