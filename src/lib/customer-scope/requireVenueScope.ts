import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';

export interface ScopedVenue {
  venueId: string;
  customerId: string;
  name: string;
  city: string;
}

type VenueScopeRow = {
  venueId: string;
  customerId: string;
  name: string;
  city: string;
};

export async function resolveScopedVenue(
  requestedVenueId: string,
): Promise<{ venue?: ScopedVenue; error?: NextResponse }> {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!session?.user || !customerId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const rows = await prisma.$queryRaw<VenueScopeRow[]>`
    SELECT "venueId", "customerId", "name", "city"
    FROM "Venue"
    WHERE "venueId" = ${requestedVenueId}
    LIMIT 1
  `;
  const venue = rows[0];
  if (!venue) {
    return { error: NextResponse.json({ error: `Venue not found: ${requestedVenueId}` }, { status: 404 }) };
  }
  if (venue.customerId !== customerId) {
    return { error: NextResponse.json({ error: 'Forbidden: venue not in customer scope' }, { status: 403 }) };
  }
  return { venue };
}
