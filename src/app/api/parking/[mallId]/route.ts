import { NextResponse } from 'next/server';
import { getIdeaparkParkingSnapshot } from '@/lib/data/ideaparkTransport';
import { isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  if (!isMallId(mallId, 'ideapark-lempaala')) {
    return NextResponse.json({ error: `Parking data not available for mall '${mallId}'` }, { status: 404 });
  }

  const snapshot = getIdeaparkParkingSnapshot(new Date());
  return NextResponse.json({ parking: snapshot }, {
    headers: { 'Cache-Control': 'no-store' }, // Real-time data
  });
}
