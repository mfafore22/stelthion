import { NextResponse } from 'next/server';
import {
  ideaparkNysseAccessibility,
  ideaparkVRConnections,
} from '@/lib/data/ideaparkTransport';
import { isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  if (!isMallId(mallId, 'ideapark-lempaala')) {
    return NextResponse.json({ error: `Transport data not available for mall '${mallId}'` }, { status: 404 });
  }

  return NextResponse.json({
    mallId,
    nysse_accessibility: ideaparkNysseAccessibility,
    vr_connections: ideaparkVRConnections,
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
