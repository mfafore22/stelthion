import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getIdeaparkUpcomingEvents } from '@/lib/data/ideaparkEvents';
import { getRealideaUpcomingEvents } from '@/lib/data/realideaEvents';
import { canonicalizeMallId, isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mallId } = await params;
  const canonicalMallId = canonicalizeMallId(mallId);

  if (isMallId(mallId, 'ideapark-lempaala')) {
    const data = getIdeaparkUpcomingEvents();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const realideaEvents = canonicalMallId ? getRealideaUpcomingEvents(canonicalMallId) : null;
  if (realideaEvents) {
    return NextResponse.json(realideaEvents, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  return NextResponse.json({
    mallId,
    venues: [],
    upcomingEvents: [],
    dataSource: 'No data available',
    lastUpdated: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
