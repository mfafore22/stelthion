import prisma from '../src/app/lib/prisma';
import { VENUE_MIND_DEMOS } from '../services/venuemind/src/demoData';

async function main() {
  const customer = await prisma.customer.upsert({
    where: { id: 'venuemind-demo' },
    update: { name: 'VenueMind Demo', serviceType: 'VENUE' },
    create: { id: 'venuemind-demo', name: 'VenueMind Demo', serviceType: 'VENUE' },
  });

  for (const venue of VENUE_MIND_DEMOS) {
    await prisma.$executeRaw`
      INSERT INTO "Venue" (
        "id", "venueId", "name", "city", "country", "capacity",
        "annualVisitors", "annualEvents", "customerId", "updatedAt"
      )
      VALUES (
        ${venue.id}, ${venue.id}, ${venue.name}, ${venue.city}, ${venue.country},
        ${venue.capacity}, ${venue.annualVisitors ?? null}, ${venue.annualEvents ?? null},
        ${customer.id}, NOW()
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
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
