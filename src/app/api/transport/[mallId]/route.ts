import { NextResponse } from 'next/server';
import {
  ideaparkNysseAccessibility,
  ideaparkVRConnections,
} from '@/lib/data/ideaparkTransport';
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
