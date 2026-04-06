import { NextResponse } from 'next/server';
import { ideaparkCatchmentDemographics } from '@/lib/data/ideaparkTransport';
import { auth } from '@/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mallId } = await params;

  if (mallId !== 'ideapark') {
    return NextResponse.json({ error: `Demographics not available for mall '${mallId}'` }, { status: 404 });
  }

  return NextResponse.json({ demographics: ideaparkCatchmentDemographics }, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}

