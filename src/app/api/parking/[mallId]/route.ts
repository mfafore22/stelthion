import { NextResponse } from 'next/server';
import { getIdeaparkParkingSnapshot } from '@/lib/data/ideaparkTransport';
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
    return NextResponse.json({ error: `Parking data not available for mall '${mallId}'` }, { status: 404 });
  }

  const snapshot = getIdeaparkParkingSnapshot(new Date());
  return NextResponse.json({ parking: snapshot }, {
    headers: { 'Cache-Control': 'no-store' }, // Real-time data
  });
}
