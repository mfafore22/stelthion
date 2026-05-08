import { NextResponse } from 'next/server';
import { getIdeaparkLiveDepartures } from '@/lib/data/ideaparkTransport';
import { getRealideaLiveDepartures } from '@/lib/data/realideaDepartures';
import { canonicalizeMallId, isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;
  const canonicalMallId = canonicalizeMallId(mallId);

  if (isMallId(mallId, 'ideapark-lempaala')) {
    const departures = getIdeaparkLiveDepartures(new Date());
    return NextResponse.json(departures, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const departures = canonicalMallId ? getRealideaLiveDepartures(canonicalMallId, new Date()) : null;
  if (departures) {
    return NextResponse.json(departures, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json({ error: `Departure data not available for mall '${mallId}'` }, { status: 404 });
}
