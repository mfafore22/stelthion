import { NextResponse } from 'next/server';
import { getIdeaparkUpcomingEvents } from '@/lib/data/ideaparkEvents';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  if (mallId !== 'ideapark') {
    return NextResponse.json({ error: `Events not available for mall '${mallId}'` }, { status: 404 });
  }

  const data = getIdeaparkUpcomingEvents();
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
