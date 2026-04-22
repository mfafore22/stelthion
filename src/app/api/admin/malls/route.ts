/**
 * GET /api/admin/malls — list malls for the admin sidebar selector.
 *
 * Phase D — admin group migration. The B.5 tenant-scoping check is
 * preserved bytewise; this commit only moves the auth/error/response
 * shaping into the defineHandler wrapper.
 */

import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => {
    return await prisma.mall.findMany({
      where: { customerId: session.user.customerId },
      orderBy: { name: 'asc' },
      select: {
        mallId: true,
        name: true,
        city: true,
        status: true,
      },
    });
  },
);
