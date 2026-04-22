/**
 * tenant-guards — explicit per-handler tenant ownership checks.
 *
 * Phase B of the production-readiness refactor. These helpers are called
 * explicitly from inside route handlers (after the defineHandler wrapper
 * has resolved auth) to assert that the calling session's customer owns
 * the resource being accessed.
 *
 * They are intentionally NOT baked into defineHandler. Reasons:
 *
 *   1. Visibility — every tenant check is grep-able at its call site.
 *      A reviewer scanning a route file can see exactly which resource
 *      is being scoped to which tenant, without knowing the wrapper's
 *      internals.
 *
 *   2. Schema independence — mall ownership requires a DB lookup
 *      (mall.customerId is on the row, not in the URL). Putting that
 *      I/O inside the wrapper would couple the wrapper to Prisma and
 *      to one specific schema layout.
 *
 *   3. Composability — some routes scope by `customerId` directly
 *      (e.g. /api/customers/[id]), some by mallId, some by jobId via
 *      mall, some by edgeDeviceId via mall. One wrapper option can't
 *      cover all four; explicit helpers can.
 *
 * Usage inside a defineHandler handler:
 *
 *   export const GET = defineHandler(
 *     { auth: 'session', paramsSchema: z.object({ id: z.string() }) },
 *     async ({ auth: session, params }) => {
 *       requireCustomerOwnership(session, params.id)
 *       return await prisma.customer.findUnique({ where: { id: params.id } })
 *     }
 *   )
 *
 *   export const GET = defineHandler(
 *     { auth: 'session', paramsSchema: z.object({ mallId: z.string() }) },
 *     async ({ auth: session, params }) => {
 *       await requireMallOwnership(session, params.mallId)
 *       return await prisma.mall.findUnique({ where: { mallId: params.mallId } })
 *     }
 *   )
 *
 * Both helpers throw HttpError(403) on mismatch. The defineHandler
 * wrapper catches HttpError and emits the appropriate JSON response.
 */

import type { Session } from 'next-auth'
import prisma from '@/server/db/client'
import { HttpError } from '@/server/api/define-handler'
import * as mallRepo from '@/server/repositories/mall'
import * as analysisJobRepo from '@/server/repositories/analysis-job'
import * as customerRepo from '@/server/repositories/customer'

/**
 * Asserts that the calling session's customer owns the given customerId.
 *
 * Throws HttpError(403) if the session's customerId does not match,
 * or HttpError(401) if the session has no customerId at all (which
 * indicates a malformed token and should not normally reach here —
 * defineHandler's auth='session' mode rejects unauthenticated requests
 * before the handler runs).
 */
export function requireCustomerOwnership(
  session: Session,
  customerId: string,
): void {
  customerRepo.assertOwnership(session, customerId)
}

/**
 * Asserts that the calling session's customer owns the mall with the
 * given mallId (the public business identifier, not the cuid pk).
 *
 * Performs a single DB lookup. Throws HttpError(404) if the mall does
 * not exist, HttpError(403) if it exists but belongs to a different
 * customer, HttpError(401) if the session has no customerId.
 *
 * Returns the mall's owning customerId on success — useful when the
 * handler also needs that value (e.g. for nested resource queries).
 */
export async function requireMallOwnership(
  session: Session,
  mallId: string,
): Promise<string> {
  return mallRepo.assertOwnership(session, mallId)
}

/**
 * Variant of requireMallOwnership that takes the Mall row's primary
 * key (cuid `id` column) instead of the public `mallId`. Some legacy
 * routes use the cuid; new routes should prefer the public mallId.
 */
export async function requireMallOwnershipByPk(
  session: Session,
  id: string,
): Promise<string> {
  return mallRepo.assertOwnershipByPk(session, id)
}

/**
 * Asserts that the calling session's customer owns the mall that the
 * given analysis job belongs to.
 *
 * Used by /api/analysis/results/[jobId], /api/analysis/journeys/[jobId],
 * and /api/analysis/insights/[jobId] — pre-Phase-D those three routes
 * trusted any authenticated user with a valid jobId, allowing a tenant
 * user to read another tenant's job output by guessing the cuid.
 *
 * Throws HttpError(404) when the job doesn't exist, HttpError(403) when
 * it belongs to another customer, HttpError(401) when the session has
 * no customerId.
 */
export async function requireJobOwnership(
  session: Session,
  jobId: string,
): Promise<string> {
  return analysisJobRepo.assertOwnership(session, jobId)
}

/**
 * Asserts that the calling session's user owns the given concierge
 * conversation (i.e. the conversation was created by this user).
 *
 * Throws HttpError(404) if the conversation does not exist, HttpError(403)
 * if it belongs to a different user, HttpError(401) if the session has no
 * userId.
 */
export async function requireConversationOwnership(
  session: Session,
  conversationId: string,
): Promise<void> {
  const callerUserId = session.user?.id
  if (!callerUserId) {
    throw new HttpError(401, 'Unauthorized')
  }

  const conv = await prisma.conciergeConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  })

  if (!conv) {
    throw new HttpError(404, 'Conversation not found')
  }
  if (conv.userId !== callerUserId) {
    throw new HttpError(403, 'Forbidden')
  }
}
