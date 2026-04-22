/**
 * GET /api/customers/[id]
 *
 * Reference route for the Phase B defineHandler refactor. Behavior is
 * preserved bytewise vs the pre-refactor handler:
 *
 *   - 401 when no session
 *   - 403 when session.user.customerId !== params.id
 *   - 404 when customer row is absent
 *   - 200 with customer + nested malls (stats, branding, categories)
 *   - 500 on unhandled exceptions (now with body { error: 'Internal server error' }
 *     instead of { error: 'Server error' } — emitted by defineHandler's
 *     generic error path. No client depends on the old text; verified by
 *     grep for the literal 'Server error' across the repo.)
 */

import { z } from 'zod'
import prisma from '@/app/lib/prisma'
import { defineHandler, HttpError } from '@/server/api/define-handler'
import { requireCustomerOwnership } from '@/server/api/tenant-guards'

const paramsSchema = z.object({ id: z.string() })

export const GET = defineHandler(
  { auth: 'session', paramsSchema },
  async ({ auth: session, params }) => {
    requireCustomerOwnership(session, params.id)

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        malls: {
          include: {
            stats: true,
            branding: true,
            categories: true,
          },
        },
      },
    })

    if (!customer) {
      throw new HttpError(404, 'Customer not found')
    }

    return customer
  },
)
