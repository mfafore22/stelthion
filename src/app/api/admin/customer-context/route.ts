import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';

/**
 * GET /api/admin/customer-context — Returns the active customer for the
 * current admin session, plus whether they may switch tenants.
 */
export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const active = await getActiveCustomer();
  if (!active) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  return NextResponse.json({
    id: active.id,
    name: active.name,
    canSwitch: active.isStelthionAdmin,
    isStelthionAdmin: active.isStelthionAdmin,
  });
}
