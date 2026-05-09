import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;
  const { id } = await params;
  const venues = await prisma.$queryRaw`
    SELECT "venueId", "name", "city", "country", "capacity", "annualVisitors", "annualEvents", "status"
    FROM "Venue"
    WHERE "customerId" = ${id}
    ORDER BY "name" ASC
  `;
  return NextResponse.json({ venues });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if ('error' in gate) return gate.error;
  const { id } = await params;
  const body = await req.json();
  if (!body.venueId || !body.name || !body.city || !body.country || !body.capacity) {
    return NextResponse.json({ error: 'venueId, name, city, country and capacity required' }, { status: 400 });
  }
  await prisma.$executeRaw`
    INSERT INTO "Venue" (
      "id", "venueId", "name", "city", "country", "capacity", "customerId", "updatedAt"
    )
    VALUES (${body.venueId}, ${body.venueId}, ${body.name}, ${body.city}, ${body.country}, ${Number(body.capacity)}, ${id}, NOW())
    ON CONFLICT ("venueId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "city" = EXCLUDED."city",
      "country" = EXCLUDED."country",
      "capacity" = EXCLUDED."capacity",
      "customerId" = EXCLUDED."customerId",
      "updatedAt" = NOW()
  `;
  const mallCount = await prisma.mall.count({ where: { customerId: id } });
  await prisma.customer.update({
    where: { id },
    data: { serviceType: mallCount > 0 ? 'MIXED' : 'VENUE' },
  });
  return NextResponse.json({ venueId: body.venueId }, { status: 201 });
}
