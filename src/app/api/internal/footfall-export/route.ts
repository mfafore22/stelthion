import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Internal service-to-service endpoint. Auth: bearer token from
// INTERNAL_SERVICE_TOKEN env var. Called by ShopperMind's FOOTFALL_COUNTER source.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get('mallId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!mallId) {
    return NextResponse.json({ error: 'mallId required' }, { status: 400 });
  }

  const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
  const toDate = to ? new Date(to) : new Date();

  const readings = await prisma.footfallReading.findMany({
    where: {
      mallId,
      date: { gte: fromDate, lte: toDate },
    },
    select: {
      zoneId: true,
      floor: true,
      date: true,
      hour: true,
      visitors: true,
    },
    orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    take: 5000,
  });

  const zoneNames = await prisma.floorplanZone.findMany({
    where: { mallId },
    select: { zoneId: true, name: true },
  });
  const nameMap = Object.fromEntries(zoneNames.map((z) => [z.zoneId, z.name]));

  return NextResponse.json({
    mallId,
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0],
    readings: readings.map((r) => ({
      zoneId: r.zoneId,
      zoneName: nameMap[r.zoneId],
      floor: r.floor,
      date: r.date.toISOString().split('T')[0],
      hour: r.hour,
      visitors: r.visitors,
    })),
  });
}
