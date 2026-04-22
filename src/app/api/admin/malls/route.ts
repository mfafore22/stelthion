/**
 * GET /api/admin/malls — list malls for the admin sidebar selector.
 *
 * Scoped to the caller's customer. Phase E: moved query into mallRepo.
 */

import { defineHandler } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => mallRepo.listForCaller(session),
);
