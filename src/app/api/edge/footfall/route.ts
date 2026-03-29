import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth';

/**
 * POST /api/edge/footfall — Receive footfall readings (camera or sensor).
 * Body: { mallId, readings: [{ zoneId, floor, date, hour, visitors, dwellSec?, source }] }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateEdgeAuth(req);
    const { readings } = await req.json();

    if (!Array.isArray(readings)) {
      return NextResponse.json(
        { error: 'readings array is required' },
        { status: 400 },
      );
    }

    let upserted = 0;
    for (const r of readings) {
      if (!r.zoneId || !r.floor || !r.date || r.hour == null) continue;

      const source = r.source ?? 'sensor';
      const date = new Date(r.date);
      date.setHours(0, 0, 0, 0);

      await prisma.footfallReading.upsert({
        where: {
          mallId_zoneId_floor_date_hour_source: {
            mallId: auth.mallId,
            zoneId: r.zoneId,
            floor: r.floor,
            date,
            hour: r.hour,
            source,
          },
        },
        update: {
          visitors: r.visitors ?? 0,
          dwellSec: r.dwellSec ?? null,
        },
        create: {
          mallId: auth.mallId,
          zoneId: r.zoneId,
          floor: r.floor,
          date,
          hour: r.hour,
          visitors: r.visitors ?? 0,
          dwellSec: r.dwellSec ?? null,
          source,
        },
      });
      upserted++;
    }

    return NextResponse.json({ ok: true, upserted });
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edge footfall error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Footfall ingestion failed' },
      { status: 500 },
    );
  }
}
