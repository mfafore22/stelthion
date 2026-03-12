import { NextResponse } from 'next/server';
import { getIdeaparkLiveDepartures } from '@/lib/data/ideaparkTransport';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  if (mallId !== 'ideapark') {
    return NextResponse.json({ error: `Departure data not available for mall '${mallId}'` }, { status: 404 });
  }

  const departures = getIdeaparkLiveDepartures(new Date());
  return NextResponse.json(departures, {
    headers: { 'Cache-Control': 'no-store' }, // Real-time data
  });
}
