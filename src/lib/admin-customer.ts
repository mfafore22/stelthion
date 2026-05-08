import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from './admin-auth';

export const ACTIVE_CUSTOMER_COOKIE = 'stelthion-active-customer';

export interface CustomerContext {
  id: string;
  name: string;
  isStelthionAdmin: boolean;
}

/**
 * Resolve the active customer for the current admin session.
 *
 * Stelthion super-admins (users on the seed `ideapark` customer) may switch
 * tenants via a signed cookie; everyone else is locked to their home customer.
 * Returns null if no session, no admin role, or no resolvable customer.
 */
export async function getActiveCustomer(): Promise<CustomerContext | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return null;

  const homeCustomerId = session.user.customerId;
  if (!homeCustomerId) return null;

  const isStelthionAdmin = homeCustomerId === 'ideapark';

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_CUSTOMER_COOKIE)?.value;

  let activeId = homeCustomerId;
  if (isStelthionAdmin && cookieValue) {
    const exists = await prisma.customer.findUnique({
      where: { id: cookieValue },
      select: { id: true },
    });
    if (exists) activeId = cookieValue;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: activeId },
    select: { id: true, name: true },
  });
  if (!customer) return null;

  return { id: customer.id, name: customer.name, isStelthionAdmin };
}

/**
 * Resolve the customer the admin has explicitly selected via the active-customer
 * cookie. Unlike `getActiveCustomer()`, this does NOT fall back to the home
 * customer — used by the post-login entry page to distinguish "selected" from
 * "default" so super-admins can be routed through the selector.
 */
export async function getSelectedCustomer(): Promise<CustomerContext | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return null;

  const homeCustomerId = session.user.customerId;
  if (!homeCustomerId) return null;

  const isStelthionAdmin = homeCustomerId === 'ideapark';

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_CUSTOMER_COOKIE)?.value;
  if (!cookieValue) return null;

  if (!isStelthionAdmin && cookieValue !== homeCustomerId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: cookieValue },
    select: { id: true, name: true },
  });
  if (!customer) return null;

  return { id: customer.id, name: customer.name, isStelthionAdmin };
}

/**
 * Returns true iff the given mallId belongs to a customer the current admin
 * session is allowed to operate on. Used to gate per-mall API routes.
 */
export async function mallBelongsToActiveCustomer(mallId: string): Promise<boolean> {
  const active = await getActiveCustomer();
  if (!active) return false;
  const mall = await prisma.mall.findUnique({
    where: { mallId },
    select: { customerId: true },
  });
  return !!mall && mall.customerId === active.id;
}

/**
 * Combined guard for per-mall admin routes: requires ADMIN role AND verifies
 * the mallId (from URL params, body, etc.) belongs to the active customer.
 */
export async function requireMallAccess(mallId: string) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard;
  const ok = await mallBelongsToActiveCustomer(mallId);
  if (!ok) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: mall not in active customer' },
        { status: 403 },
      ),
    };
  }
  return guard;
}

/**
 * Returns the list of mallIds owned by the active customer, or null if no
 * active customer is resolvable. Cross-route helper used to scope per-mall
 * resources (jobs, edge devices, etc.).
 */
export async function activeCustomerMallIds(): Promise<string[] | null> {
  const active = await getActiveCustomer();
  if (!active) return null;
  const malls = await prisma.mall.findMany({
    where: { customerId: active.id },
    select: { mallId: true },
  });
  return malls.map((m) => m.mallId);
}

/**
 * Returns the list of mallIds visible to the current session — for ADMIN users
 * this respects the active-customer cookie; for regular users it is locked to
 * their home customer. Returns null if no resolvable session/customer.
 *
 * Use this in non-/admin/ APIs that are still reached from authenticated UI
 * (e.g. /api/analysis/*) so cross-tenant access is blocked.
 */
export async function currentUserMallIds(): Promise<string[] | null> {
  const session = await auth();
  if (!session?.user?.customerId) return null;
  if (session.user.role === 'ADMIN') {
    return activeCustomerMallIds();
  }
  const malls = await prisma.mall.findMany({
    where: { customerId: session.user.customerId },
    select: { mallId: true },
  });
  return malls.map((m) => m.mallId);
}

/**
 * Verify a target customerId is one the current admin is allowed to act on:
 * either it matches the user's home customer, or the user is a Stelthion
 * super-admin.
 */
export async function requireOwnedCustomer(customerId: string) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard;
  const homeCustomerId = guard.session.user.customerId;
  const isStelthionAdmin = homeCustomerId === 'ideapark';
  if (!isStelthionAdmin && customerId !== homeCustomerId) {
    return {
      error: NextResponse.json({ error: 'Forbidden: not your customer' }, { status: 403 }),
    };
  }
  return guard;
}

/**
 * Verify an analysis job belongs to a mall in the active customer.
 */
export async function jobBelongsToActiveCustomer(jobId: string): Promise<boolean> {
  const mallIds = await activeCustomerMallIds();
  if (!mallIds) return false;
  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    select: { mallId: true },
  });
  return !!job && mallIds.includes(job.mallId);
}

export async function listSelectableCustomers(): Promise<{ id: string; name: string }[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') return [];

  const isStelthionAdmin = session.user.customerId === 'ideapark';
  if (!isStelthionAdmin) {
    const own = await prisma.customer.findUnique({
      where: { id: session.user.customerId },
      select: { id: true, name: true },
    });
    return own ? [own] : [];
  }

  return prisma.customer.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}
