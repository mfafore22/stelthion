/**
 * customerRepo — data access for the Customer model with tenant
 * scoping baked in.
 *
 * Customer is the tenant entity itself: ownership is a pure session
 * check (`session.user.customerId === customerId`), no DB lookup
 * needed. The repo still exists to:
 *
 *   - Centralize the common "fetch own portfolio with malls + stats
 *     + branding + categories" shape, which was previously duplicated
 *     between /api/customers/[id] and /dashboard.
 *   - Make it easy to add a customerId parameter to future handlers
 *     without each one re-inventing the guard.
 */

import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';
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
 * Assert the calling session owns the customer with the given id.
 *
 * No DB lookup — a Customer's id *is* the session's customerId, so
 * ownership is just a string comparison. Throws HttpError(403) on
 * mismatch, HttpError(401) when the session has no customerId.
 */
export function assertOwnership(session: Session, customerId: string): void {
  const callerCustomerId = requireCallerCustomerId(session);
  if (callerCustomerId !== customerId) {
    throw new HttpError(403, 'Forbidden');
  }
}

/**
 * The canonical "fetch my own portfolio" read used by the customer
 * detail route and the dashboard landing page. Returns the caller's
 * Customer row with a fully-loaded malls tree (stats + branding +
 * categories). Throws HttpError(404) if the row is missing (e.g. a
 * deleted customer with a still-valid session token).
 */
export async function findOwnWithMalls(session: Session) {
  const callerCustomerId = requireCallerCustomerId(session);

  const customer = await prisma.customer.findUnique({
    where: { id: callerCustomerId },
    include: {
      malls: {
        include: {
          stats: true,
          branding: true,
          categories: true,
        },
      },
    },
  });

  if (!customer) {
    throw new HttpError(404, 'Customer not found');
  }
  return customer;
}

/**
 * Update mutable fields on the caller's own Customer row (e.g.
 * company name). Scoped by session: the caller can only update
 * their own tenant.
 */
export async function updateOwn(
  session: Session,
  data: Prisma.CustomerUpdateInput,
) {
  const callerCustomerId = requireCallerCustomerId(session);
  return prisma.customer.update({
    where: { id: callerCustomerId },
    data,
  });
}
