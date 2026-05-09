import { NextRequest, NextResponse } from 'next/server';
import { resolveScopedVenue } from '@/lib/customer-scope/requireVenueScope';

export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get('venueId');
  if (!venueId) return NextResponse.json({ error: 'venueId required' }, { status: 400 });
  const scope = await resolveScopedVenue(venueId);
  if (scope.error) return scope.error;
  return NextResponse.json([]);
}
