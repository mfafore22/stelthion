import { NextResponse } from 'next/server';
import { getIdeaparkLiveDepartures } from '@/lib/data/ideaparkTransport';
import { auth } from '@/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mallId } = await params;

  if (mallId !== 'ideapark') {
    return NextResponse.json({ error: `Departure data not available for mall '${mallId}'` }, { status: 404 });
  }

  const departures = getIdeaparkLiveDepartures(new Date());
  return NextResponse.json(departures, {
    headers: { 'Cache-Control': 'no-store' }, // Real-time data
  });
}
