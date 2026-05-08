import { NextResponse } from 'next/server';
import { ideaparkCatchmentDemographics } from '@/lib/data/ideaparkTransport';
import { realideaCatchments } from '@/lib/data/realideaLocationMetrics';
import { auth } from '@/auth';
import { canonicalizeMallId, isMallId } from '@/lib/mall/ids';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mallId } = await params;
  const canonicalMallId = canonicalizeMallId(mallId);

  if (isMallId(mallId, 'ideapark-lempaala')) {
    return NextResponse.json({ demographics: ideaparkCatchmentDemographics }, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  }

  const demographics = canonicalMallId ? realideaCatchments[canonicalMallId as keyof typeof realideaCatchments] : null;
  if (demographics) {
    return NextResponse.json({ demographics }, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  }

  return NextResponse.json({ error: `Demographics not available for mall '${mallId}'` }, { status: 404 });
}
