import { NextResponse } from 'next/server';
import { ideaparkCatchmentDemographics } from '@/lib/data/ideaparkTransport';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mallId: string }> }
) {
  const { mallId } = await params;

  if (mallId !== 'ideapark') {
    return NextResponse.json({ error: `Demographics not available for mall '${mallId}'` }, { status: 404 });
  }

  return NextResponse.json({ demographics: ideaparkCatchmentDemographics }, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
