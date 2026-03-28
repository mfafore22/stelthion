import { NextResponse } from 'next/server';
import { getIdeaparkUpcomingEvents } from '@/lib/data/ideaparkEvents';
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

  if (mallId === 'ideapark') {
    const data = getIdeaparkUpcomingEvents();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  // Return empty events for malls without data yet
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
