/**
 * conciergeRepo — data access for the Concierge domain:
 * ConciergeConversation, ConciergeMessage, ConciergeBriefing,
 * ConciergeBriefingSubscription.
 *
 * Ownership model (two distinct axes)
 * -----------------------------------
 *
 * ConciergeConversation + ConciergeMessage are USER-scoped. A conversation
 * is private to the user who created it — other admins inside the same
 * tenant must NOT be able to read or append to it. The check compares
 * conversation.userId against session.user.id.
 *
 * ConciergeBriefing + ConciergeBriefingSubscription are (mallId, userId)
 * composite-scoped. The caller must:
 *   1. own the mall (delegated to mallRepo.assertOwnership), and
 *   2. operate on their OWN userId row — the scoped helpers hard-code
 *      the userId from the session, so a caller can never touch another
 *      user's briefing/subscription by forging the body.
 *
 * Unscoped helpers exist for the cron route (src/app/api/cron/briefing),
 * which is gated by a CRON_SECRET header rather than a session and
 * deliberately operates across all tenants.
 */

import type { Session } from 'next-auth';
import type {
  ConciergeBriefing,
  ConciergeBriefingSubscription,
  ConciergeConversation,
  ConciergeMessage,
  Prisma,
} from '@prisma/client';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';

function requireCallerUserId(session: Session): string {
  const id = session.user?.id;
  if (!id) throw new HttpError(401, 'Unauthorized');
  return id;
}

// ─── Conversation ownership ──────────────────────────────────────────

/**
 * Assert that the calling user owns the given conversation (by
 * Conversation.userId === session.user.id). Used by /api/concierge/chat
 * when resuming an existing conversation.
 */
export async function assertConversationOwnership(
  session: Session,
  conversationId: string,
): Promise<void> {
  const callerUserId = requireCallerUserId(session);

  const conv = await prisma.conciergeConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  });

  if (!conv) throw new HttpError(404, 'Conversation not found');
  if (conv.userId !== callerUserId) throw new HttpError(403, 'Forbidden');
}

/**
 * Create a new conversation owned by the calling user, scoped to a mall
 * the caller owns. Returns the created row.
 */
export async function createConversationForCaller(
  session: Session,
  mallId: string,
  title: string,
): Promise<ConciergeConversation> {
  await mallRepo.assertOwnership(session, mallId);
  const userId = requireCallerUserId(session);
  return prisma.conciergeConversation.create({
    data: { mallId, userId, title },
  });
}

/**
 * Append a message to a conversation after re-asserting the caller owns
 * it. This is the safe path for both user and agent messages — the agent
 * path still goes through this helper so the ownership invariant holds
 * even if the agent loop is modified to accept a client-supplied id.
 */
export async function appendMessageForCaller(
  session: Session,
  conversationId: string,
  data: Omit<Prisma.ConciergeMessageUncheckedCreateInput, 'conversationId'>,
): Promise<ConciergeMessage> {
  await assertConversationOwnership(session, conversationId);
  return prisma.conciergeMessage.create({
    data: { ...data, conversationId },
  });
}

/**
 * List a conversation's messages in chronological order, after
 * asserting ownership. `take` defaults to 40 (the chat history window).
 */
export async function listMessagesForCaller(
  session: Session,
  conversationId: string,
  take = 40,
): Promise<ConciergeMessage[]> {
  await assertConversationOwnership(session, conversationId);
  return prisma.conciergeMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take,
  });
}

/**
 * Bump `updatedAt` on a conversation after asserting ownership.
 */
export async function touchConversationForCaller(
  session: Session,
  conversationId: string,
): Promise<void> {
  await assertConversationOwnership(session, conversationId);
  await prisma.conciergeConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

// ─── Briefing (scoped to session user + owned mall) ──────────────────

/**
 * Fetch today's briefing (or any date-keyed briefing) for the calling
 * user in a mall the caller owns. Returns `null` when none exists —
 * callers decide whether to synthesize an empty payload or 404.
 */
export async function getBriefingForCaller(
  session: Session,
  mallId: string,
  date: Date,
): Promise<ConciergeBriefing | null> {
  await mallRepo.assertOwnership(session, mallId);
  const userId = requireCallerUserId(session);
  return prisma.conciergeBriefing.findUnique({
    where: { mallId_userId_date: { mallId, userId, date } },
  });
}

/**
 * Upsert today's briefing (or any date-keyed briefing) for the calling
 * user in a mall the caller owns.
 */
export async function upsertBriefingForCaller(
  session: Session,
  mallId: string,
  date: Date,
  content: Prisma.InputJsonValue,
): Promise<ConciergeBriefing> {
  await mallRepo.assertOwnership(session, mallId);
  const userId = requireCallerUserId(session);
  return prisma.conciergeBriefing.upsert({
    where: { mallId_userId_date: { mallId, userId, date } },
    create: { mallId, userId, date, content, sentAt: new Date() },
    update: { content, sentAt: new Date() },
  });
}

// ─── BriefingSubscription (scoped to session user + owned mall) ──────

/**
 * Fetch the caller's briefing subscription for a mall they own.
 * Returns `null` when no row exists.
 */
export async function getSubscriptionForCaller(
  session: Session,
  mallId: string,
): Promise<ConciergeBriefingSubscription | null> {
  await mallRepo.assertOwnership(session, mallId);
  const userId = requireCallerUserId(session);
  return prisma.conciergeBriefingSubscription.findUnique({
    where: { mallId_userId: { mallId, userId } },
  });
}

export interface UpsertSubscriptionInput {
  enabled?: boolean;
  timeUtc?: string;
  sections?: string[];
}

/**
 * Upsert the caller's briefing subscription for a mall they own. The
 * create branch fills in defaults matching the original inline route.
 */
export async function upsertSubscriptionForCaller(
  session: Session,
  mallId: string,
  input: UpsertSubscriptionInput,
): Promise<ConciergeBriefingSubscription> {
  await mallRepo.assertOwnership(session, mallId);
  const userId = requireCallerUserId(session);
  const defaultSections = ['weather', 'footfall', 'events', 'transport'];
  return prisma.conciergeBriefingSubscription.upsert({
    where: { mallId_userId: { mallId, userId } },
    create: {
      mallId,
      userId,
      enabled: input.enabled ?? true,
      timeUtc: input.timeUtc ?? '06:00',
      sections: input.sections ?? defaultSections,
    },
    update: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.timeUtc ? { timeUtc: input.timeUtc } : {}),
      ...(input.sections ? { sections: input.sections } : {}),
    },
  });
}

// ─── Cron-only unscoped helpers ──────────────────────────────────────

/**
 * Cron-only: list every enabled subscription across all tenants. The
 * cron route is gated by CRON_SECRET, not by a session — this helper
 * exists so the cron route no longer reaches into prisma directly.
 */
export async function listEnabledSubscriptionsUnscoped(): Promise<
  ConciergeBriefingSubscription[]
> {
  return prisma.conciergeBriefingSubscription.findMany({
    where: { enabled: true },
  });
}

/**
 * Cron-only: check whether a briefing already exists for a (mall, user,
 * date) triple, without a session-scoped ownership check. The cron loop
 * uses this to skip already-generated briefings.
 */
export async function findBriefingByKeyUnscoped(
  mallId: string,
  userId: string,
  date: Date,
): Promise<ConciergeBriefing | null> {
  return prisma.conciergeBriefing.findUnique({
    where: { mallId_userId_date: { mallId, userId, date } },
  });
}

/**
 * Cron-only: create a briefing for a (mall, user, date) triple without
 * a session-scoped ownership check.
 */
export async function createBriefingUnscoped(
  mallId: string,
  userId: string,
  date: Date,
  content: Prisma.InputJsonValue,
): Promise<ConciergeBriefing> {
  return prisma.conciergeBriefing.create({
    data: { mallId, userId, date, content, sentAt: new Date() },
  });
}
