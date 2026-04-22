import { z } from 'zod';
import { NextResponse } from 'next/server';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { generateBriefing } from '@/services/concierge/briefing-generator';
import * as conciergeRepo from '@/server/repositories/concierge';

/**
 * Phase E — conciergeRepo migration. Ownership (mall + user) lives in
 * the repo; the route shapes request/response and drives the briefing
 * generator.
 */

function todayStartOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const GET = defineHandler(
  { auth: 'session' },
  async ({ req, auth: session }) => {
    const mallId = new URL(req.url).searchParams.get('mallId');
    if (!mallId) throw new HttpError(400, 'mallId required');

    const existing = await conciergeRepo.getBriefingForCaller(
      session,
      mallId,
      todayStartOfDay(),
    );

    if (existing) return existing;
    return { briefing: null };
  },
);

export const POST = defineHandler(
  {
    auth: 'session',
    bodySchema: z.object({ mallId: z.string() }),
  },
  async ({ body, auth: session }) => {
    const sub = await conciergeRepo.getSubscriptionForCaller(session, body.mallId);

    const sections = sub?.sections
      ? (sub.sections as string[])
      : ['weather', 'footfall', 'events', 'transport'];

    const briefingData = await generateBriefing(body.mallId, sections);

    const briefing = await conciergeRepo.upsertBriefingForCaller(
      session,
      body.mallId,
      todayStartOfDay(),
      JSON.parse(JSON.stringify(briefingData)),
    );

    return NextResponse.json(briefing, { status: 201 });
  },
);
