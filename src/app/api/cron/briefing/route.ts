import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { generateBriefing } from '@/services/concierge/briefing-generator';

/**
 * Cron-triggered briefing generation.
 * Secured by CRON_SECRET header.
 * Iterates all active subscriptions and generates briefings.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all active subscriptions
  const subscriptions = await prisma.conciergeBriefingSubscription.findMany({
    where: { enabled: true },
  });

  let generated = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    // Check if briefing already exists for today
    const existing = await prisma.conciergeBriefing.findUnique({
      where: {
        mallId_userId_date: {
          mallId: sub.mallId,
          userId: sub.userId,
          date: today,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    try {
      const sections = (sub.sections as string[]) || ['weather', 'footfall', 'events', 'transport'];
      const briefingData = await generateBriefing(sub.mallId, sections);

      await prisma.conciergeBriefing.create({
        data: {
          mallId: sub.mallId,
          userId: sub.userId,
          date: today,
          content: JSON.parse(JSON.stringify(briefingData)),
          sentAt: new Date(),
        },
      });

      generated++;
    } catch (error) {
      console.error(`Failed to generate briefing for ${sub.mallId}/${sub.userId}:`, error);
    }
  }

  return NextResponse.json({
    total: subscriptions.length,
    generated,
    skipped,
  });
}
