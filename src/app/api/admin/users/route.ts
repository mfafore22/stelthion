/**
 * /api/admin/users
 *
 * Phase D — admin group migration. The B.5 tenant-scoping checks are
 * preserved bytewise; this commit only moves the auth/error/response
 * shaping into the defineHandler wrapper and the body validation into
 * a Zod bodySchema.
 *
 * Tenant scoping (unchanged from B.5):
 *   - GET filters prisma.user.findMany by session.user.customerId.
 *   - POST ignores client-supplied customerId; the new user is always
 *     created under the calling admin's customer.
 */

import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import { createUserAndSendWelcome } from '@/lib/email/sendOTP';

// ─── GET ────────────────────────────────────────────────────────────

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => {
    return await prisma.user.findMany({
      where: { customerId: session.user.customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    });
  },
);

// ─── POST ───────────────────────────────────────────────────────────

const createUserSchema = z.object({
  email: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional(),
  // customerId is intentionally NOT in the schema. Even if a client
  // includes it, Zod strips it (default behavior); the body's value
  // never reaches the user creation call. The session's customerId
  // wins.
});

export const POST = defineHandler(
  { auth: 'admin', bodySchema: createUserSchema },
  async ({ body, auth: session }) => {
    try {
      const result = await createUserAndSendWelcome({
        email: body.email,
        name: body.name,
        customerId: session.user.customerId,
        role: body.role || 'USER',
      });

      return {
        ok: true,
        userId: result.userId,
        message: `Welcome email sent to ${body.email}`,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new HttpError(409, error.message);
      }
      throw error;
    }
  },
);
