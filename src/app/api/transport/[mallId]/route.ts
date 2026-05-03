import { NextResponse } from 'next/server';
import {
  ideaparkNysseAccessibility,
  ideaparkVRConnections,
} from '@/lib/data/ideaparkTransport';
import { getRealideaTransport } from '@/lib/data/realideaTransport';
import { canonicalizeMallId, isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;
  const canonicalMallId = canonicalizeMallId(mallId);

  if (isMallId(mallId, 'ideapark-lempaala')) {
    return NextResponse.json({
      mallId: canonicalMallId,
      nysse_accessibility: ideaparkNysseAccessibility,
      vr_connections: ideaparkVRConnections,
    }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const realidea = canonicalMallId ? getRealideaTransport(canonicalMallId) : null;
  if (realidea) {
    return NextResponse.json({
      mallId: canonicalMallId,
      hsl_accessibility: realidea.hsl,
      vr_connections: realidea.vr,
    }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  return NextResponse.json({ error: `Transport data not available for mall '${mallId}'` }, { status: 404 });
}
