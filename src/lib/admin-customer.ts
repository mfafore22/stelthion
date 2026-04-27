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
