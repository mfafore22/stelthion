import { NextRequest, NextResponse } from 'next/server';
import { generateBriefing } from '@/services/concierge/briefing-generator';
import * as conciergeRepo from '@/server/repositories/concierge';

/**
 * Cron-triggered briefing generation.
 * Secured by CRON_SECRET header.
 * Iterates all active subscriptions and generates briefings.
 *
 * Phase E — DB access routed through conciergeRepo's Unscoped helpers.
 * The cron is tenant-crossing by design (it generates for every user
 * who has opted in, across all malls), so it intentionally uses the
 * Unscoped path rather than session-scoped helpers.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subscriptions = await conciergeRepo.listEnabledSubscriptionsUnscoped();

  let generated = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    const existing = await conciergeRepo.findBriefingByKeyUnscoped(
      sub.mallId,
      sub.userId,
      today,
    );

    if (existing) {
      skipped++;
      continue;
    }

    try {
      const sections = (sub.sections as string[]) || [
        'weather',
        'footfall',
        'events',
        'transport',
      ];
      const briefingData = await generateBriefing(sub.mallId, sections);

      await conciergeRepo.createBriefingUnscoped(
        sub.mallId,
        sub.userId,
        today,
        JSON.parse(JSON.stringify(briefingData)),
      );

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
