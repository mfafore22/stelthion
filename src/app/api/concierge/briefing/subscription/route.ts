import { z } from 'zod';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import * as conciergeRepo from '@/server/repositories/concierge';

/**
 * Phase E — conciergeRepo migration. Ownership (mall + user) lives in
 * the repo. GET returns default values when no subscription row exists
 * so the UI can render a clean form.
 */

export const GET = defineHandler(
  { auth: 'session' },
  async ({ req, auth: session }) => {
    const mallId = new URL(req.url).searchParams.get('mallId');
    if (!mallId) throw new HttpError(400, 'mallId required');

    const sub = await conciergeRepo.getSubscriptionForCaller(session, mallId);

    return (
      sub || {
        enabled: false,
        timeUtc: '06:00',
        sections: ['weather', 'footfall', 'events', 'transport'],
      }
    );
  },
);

export const PUT = defineHandler(
  {
    auth: 'session',
    bodySchema: z.object({
      mallId: z.string(),
      enabled: z.boolean().optional(),
      timeUtc: z.string().optional(),
      sections: z.array(z.string()).optional(),
    }),
  },
  async ({ body, auth: session }) => {
    return conciergeRepo.upsertSubscriptionForCaller(session, body.mallId, {
      enabled: body.enabled,
      timeUtc: body.timeUtc,
      sections: body.sections,
    });
  },
);
