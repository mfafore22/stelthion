import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';
import { listShopperMindActivity } from '@/lib/shoppermind/activity-store';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const active = await getActiveCustomer();
  if (!active) return NextResponse.json({ error: 'No active customer' }, { status: 409 });

  const days = Number(new URL(req.url).searchParams.get('days') ?? 30);
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const rows = await listShopperMindActivity(active.id, since);
  if (!rows) return NextResponse.json({ configured: false, rows: [], aggregates: empty() });

  return NextResponse.json({ configured: true, rows, aggregates: aggregate(rows) });
}

function empty() {
  return { events: [], tabs: [], entities: [], categories: [], malls: [] };
}

function aggregate(rows: Array<Record<string, unknown>>) {
  const bump = (map: Map<string, number>, key: unknown) => {
    if (typeof key === 'string' && key) map.set(key, (map.get(key) ?? 0) + 1);
  };
  const eventMap = new Map<string, number>();
  const tabMap = new Map<string, number>();
  const entityMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const mallMap = new Map<string, number>();
  for (const row of rows) {
    bump(eventMap, row.eventName);
    bump(tabMap, row.tab);
    bump(entityMap, row.entityType);
    bump(mallMap, row.mallId);
    if (Array.isArray(row.categoryIds)) row.categoryIds.forEach((c) => bump(categoryMap, c));
  }
  return {
    events: top(eventMap),
    tabs: top(tabMap),
    entities: top(entityMap),
    categories: top(categoryMap),
    malls: top(mallMap),
  };
}

function top(map: Map<string, number>) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([label, count]) => ({ label, count }));
}
