/**
 * GET /api/ideapark/stores
 *
 * Returns all Ideapark Lempäälä stores fetched from the Wayfinder CMS endpoint,
 * normalised and zone-mapped.
 *
 * Query params:
 *   ?zone=<zoneId>   — filter to a single zone (e.g. "food-court")
 *
 * Response is cached for 1 hour server-side via Next.js fetch revalidation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseInfotauluResponse } from '@/lib/data/ideaparkStores';
import { auth } from '@/auth';

const INFOTAULU_URL = 'https://lempaala.ideapark.fi?infotaulu=1';

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl;
  const zoneFilter = searchParams.get('zone');

  let data: unknown;
  try {
    const res = await fetch(INFOTAULU_URL, {
      next: { revalidate: 3600 }, // cache 1 hour
      headers: {
        // Mimic a browser request so the CMS doesn't block the scrape
        'User-Agent': 'Mozilla/5.0 (compatible; Stelthion/1.0)',
        Accept: 'application/json, text/javascript, */*',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    data = await res.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Fetch error: ${message}` }, { status: 502 });
  }

  let stores = parseInfotauluResponse(data);

  if (zoneFilter) {
    stores = stores.filter((s) => s.zoneId === zoneFilter);
  }

  return NextResponse.json(stores, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
