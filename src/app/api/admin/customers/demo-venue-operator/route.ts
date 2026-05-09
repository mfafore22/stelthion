import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getActiveCustomer } from '@/lib/admin-customer';
import { VENUE_OPERATOR_DEMO } from '@/lib/venue/demoOperator';

export async function POST() {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;
  const active = await getActiveCustomer();
  if (!active?.isStelthionAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const planId = await venuePlanId();
  await prisma.customer.upsert({
    where: { id: VENUE_OPERATOR_DEMO.customerId },
    create: {
      id: VENUE_OPERATOR_DEMO.customerId,
      name: VENUE_OPERATOR_DEMO.name,
      serviceType: 'VENUE',
      planId,
    },
    update: { name: VENUE_OPERATOR_DEMO.name, serviceType: 'VENUE', planId },
  });
  for (const venue of VENUE_OPERATOR_DEMO.venues) await upsertVenue(venue);
  return NextResponse.json({
    id: VENUE_OPERATOR_DEMO.customerId,
    name: VENUE_OPERATOR_DEMO.name,
    venues: VENUE_OPERATOR_DEMO.venues.map((venue) => venue.venueId),
  }, { status: 201 });
}

async function venuePlanId(): Promise<string | null> {
  const plans = await prisma.plan.findMany({ select: { id: true, features: true } });
  return plans.find((plan) =>
    Boolean((plan.features as { venueMind?: boolean } | null)?.venueMind))?.id ?? null;
}

async function upsertVenue(venue: typeof VENUE_OPERATOR_DEMO.venues[number]) {
  await prisma.$executeRaw`
    INSERT INTO "Venue" (
      "id", "venueId", "name", "city", "country", "capacity",
      "annualVisitors", "annualEvents", "customerId", "updatedAt"
    )
    VALUES (
      ${venue.venueId}, ${venue.venueId}, ${venue.name}, ${venue.city},
      ${venue.country}, ${venue.capacity}, ${venue.annualVisitors ?? null},
      ${venue.annualEvents ?? null}, ${VENUE_OPERATOR_DEMO.customerId}, NOW()
    )
    ON CONFLICT ("venueId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "city" = EXCLUDED."city",
      "country" = EXCLUDED."country",
      "capacity" = EXCLUDED."capacity",
      "annualVisitors" = EXCLUDED."annualVisitors",
      "annualEvents" = EXCLUDED."annualEvents",
      "customerId" = EXCLUDED."customerId",
      "updatedAt" = NOW()
  `;
  for (const zone of venue.zones) await upsertZone(venue.venueId, zone);
}

async function upsertZone(venueId: string, zone: readonly [string, string, string, number, boolean]) {
  await prisma.$executeRaw`
    INSERT INTO "VenueZone" ("venueId", "zoneId", "name", "category", "capacity", "sensorReady")
    VALUES (${venueId}, ${zone[0]}, ${zone[1]}, ${zone[2]}, ${zone[3]}, ${zone[4]})
    ON CONFLICT ("venueId", "zoneId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "category" = EXCLUDED."category",
      "capacity" = EXCLUDED."capacity",
      "sensorReady" = EXCLUDED."sensorReady"
  `;
}
