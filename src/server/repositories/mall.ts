/**
 * mallRepo — data access for the Mall model with tenant scoping baked in.
 *
 * Phase E introduces the repository layer. The defining property of this
 * module is that the primary read methods take a Session and enforce
 * customer ownership internally, so callers cannot accidentally forget
 * the ownership check. This makes the safe path the only path.
 *
 * Unscoped escape hatches (suffixed `Unscoped`) exist for a small set of
 * documented use cases:
 *   - Explicitly public endpoints (e.g. /api/mall/[mallId] landing data)
 *   - Multi-step flows that resolve a mallId before enforcing ownership
 *     (e.g. concierge chat's short-name → full-mallId prefix lookup,
 *     which then calls assertOwnership on the resolved mallId).
 *
 * Any new call to an `Unscoped` method should be reviewed carefully.
 */

import type { Session } from 'next-auth';
import type { Mall, Prisma } from '@prisma/client';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';

function requireCallerCustomerId(session: Session): string {
  const callerCustomerId = session.user?.customerId;
  if (!callerCustomerId) {
    throw new HttpError(401, 'Unauthorized');
  }
  return callerCustomerId;
}

/**
 * Assert the calling session owns the mall with the given public mallId.
 * Returns the owning customerId on success.
 *
 * Throws HttpError(404) if the mall doesn't exist, HttpError(403) if it
 * belongs to a different customer, HttpError(401) if the session has no
 * customerId.
 */
export async function assertOwnership(
  session: Session,
  mallId: string,
): Promise<string> {
  const callerCustomerId = requireCallerCustomerId(session);

  const mall = await prisma.mall.findUnique({
    where: { mallId },
    select: { customerId: true },
  });

  if (!mall) throw new HttpError(404, 'Mall not found');
  if (mall.customerId !== callerCustomerId) throw new HttpError(403, 'Forbidden');
  return mall.customerId;
}

/**
 * Variant of `assertOwnership` that takes the Prisma cuid primary key
 * (the `id` column) instead of the public `mallId`. Some legacy routes
 * use the cuid; new routes should prefer the public mallId.
 */
export async function assertOwnershipByPk(
  session: Session,
  id: string,
): Promise<string> {
  const callerCustomerId = requireCallerCustomerId(session);

  const mall = await prisma.mall.findUnique({
    where: { id },
    select: { customerId: true },
  });

  if (!mall) throw new HttpError(404, 'Mall not found');
  if (mall.customerId !== callerCustomerId) throw new HttpError(403, 'Forbidden');
  return mall.customerId;
}

/**
 * Fetch a Mall row by public mallId, enforcing tenant ownership.
 *
 * Throws HttpError(404) when the mall doesn't exist, HttpError(403) when
 * it belongs to a different customer, HttpError(401) when the session
 * has no customerId.
 */
export async function findByMallId(
  session: Session,
  mallId: string,
): Promise<Mall> {
  const callerCustomerId = requireCallerCustomerId(session);

  const mall = await prisma.mall.findUnique({ where: { mallId } });
  if (!mall) throw new HttpError(404, 'Mall not found');
  if (mall.customerId !== callerCustomerId) throw new HttpError(403, 'Forbidden');
  return mall;
}

/**
 * Resolve a URL path parameter that may be either a public mallId OR a
 * customerId (legacy compatibility — some routes were documented with
 * `mallId` but historically accepted either). Enforces ownership on
 * whichever branch hits.
 *
 * Throws HttpError(404) when neither branch resolves, HttpError(403)
 * when the resolved mall belongs to a different customer.
 */
export async function resolveMallIdOrCustomerId(
  session: Session,
  param: string,
): Promise<string> {
  const callerCustomerId = requireCallerCustomerId(session);

  const byMallId = await prisma.mall.findUnique({
    where: { mallId: param },
    select: { mallId: true, customerId: true },
  });

  if (byMallId) {
    if (byMallId.customerId !== callerCustomerId) {
      throw new HttpError(403, 'Forbidden');
    }
    return byMallId.mallId;
  }

  const byCustomer = await prisma.mall.findFirst({
    where: { customerId: param },
    select: { mallId: true, customerId: true },
  });

  if (!byCustomer) throw new HttpError(404, 'Mall not found');
  if (byCustomer.customerId !== callerCustomerId) {
    throw new HttpError(403, 'Forbidden');
  }
  return byCustomer.mallId;
}

/**
 * List malls owned by the calling session's customer. Returns a trimmed
 * column set suitable for sidebar/picker UIs.
 */
export async function listForCaller(
  session: Session,
): Promise<Array<Pick<Mall, 'mallId' | 'name' | 'city' | 'status'>>> {
  const callerCustomerId = requireCallerCustomerId(session);

  return prisma.mall.findMany({
    where: { customerId: callerCustomerId },
    orderBy: { name: 'asc' },
    select: {
      mallId: true,
      name: true,
      city: true,
      status: true,
    },
  });
}

// ─── Unscoped escape hatches ────────────────────────────────────────────
//
// These bypass tenant ownership and should only be used for:
//   - Explicitly public endpoints.
//   - Multi-step flows that resolve a mallId before enforcing ownership
//     (follow up with assertOwnership).
//
// New callers must justify the bypass in a comment. If in doubt, use a
// scoped method and add the session argument.

/**
 * Resolve a short mallId prefix to its canonical form (e.g. 'ideapark' →
 * 'ideapark-lempaala'). Tries exact match first, then prefix match.
 * Returns `null` when neither hits. Does NOT enforce ownership —
 * callers must follow up with `assertOwnership` before any sensitive use.
 */
export async function resolveMallIdUnscoped(
  input: string,
): Promise<string | null> {
  const exact = await prisma.mall.findUnique({
    where: { mallId: input },
    select: { mallId: true },
  });
  if (exact) return exact.mallId;

  const byPrefix = await prisma.mall.findFirst({
    where: { mallId: { startsWith: input } },
    select: { mallId: true },
  });
  return byPrefix?.mallId ?? null;
}

/**
 * Fetch a Mall row + specified relations WITHOUT enforcing ownership.
 * Only for explicitly public endpoints. Returns `null` on miss.
 */
export async function findByMallIdWithRelationsUnscoped<
  I extends Prisma.MallInclude,
>(
  mallId: string,
  include: I,
): Promise<Prisma.MallGetPayload<{ include: I }> | null> {
  return prisma.mall.findUnique({
    where: { mallId },
    include,
  }) as Promise<Prisma.MallGetPayload<{ include: I }> | null>;
}
