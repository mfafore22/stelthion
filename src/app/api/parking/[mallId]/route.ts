import { NextResponse } from 'next/server';
import { getIdeaparkParkingSnapshot } from '@/lib/data/ideaparkTransport';
import { getRealideaParkingSnapshot } from '@/lib/data/realideaLocationMetrics';
import { canonicalizeMallId, isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;
  const canonicalMallId = canonicalizeMallId(mallId);

  if (isMallId(mallId, 'ideapark-lempaala')) {
    const snapshot = getIdeaparkParkingSnapshot(new Date());
    return NextResponse.json({ parking: snapshot }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const snapshot = canonicalMallId ? getRealideaParkingSnapshot(canonicalMallId, new Date()) : null;
  if (snapshot) {
    return NextResponse.json({ parking: snapshot }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json({ error: `Parking data not available for mall '${mallId}'` }, { status: 404 });
}
