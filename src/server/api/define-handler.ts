/**
 * defineHandler — the canonical wrapper for Next.js API route handlers.
 *
 * Phase B of the production-readiness refactor. This wrapper centralizes
 * the four cross-cutting concerns that ~70 route files reimplement today:
 *
 *   1. Authentication (session / admin / edge / public)
 *   2. Schema validation of params and body (zod, optional)
 *   3. Error handling (HttpError, EdgeAuthError, ZodError, generic)
 *   4. Response shape (Response passthrough or NextResponse.json)
 *
 * Usage:
 *
 *   import { defineHandler, HttpError } from '@/server/api/define-handler'
 *
 *   export const GET = defineHandler(
 *     { auth: 'session', paramsSchema: z.object({ id: z.string() }) },
 *     async ({ auth: session, params }) => {
 *       if (session.user.customerId !== params.id) {
 *         throw new HttpError(403, 'Forbidden')
 *       }
 *       return await prisma.customer.findUnique({ where: { id: params.id } })
 *     }
 *   )
 *
 * The wrapper is opt-in. Existing routes continue to work unchanged
 * until Phase D migrates them route-group by route-group.
 *
 * Tenant scoping is NOT baked into the wrapper. It is provided by
 * separate helpers (requireCustomerOwnership, requireMallOwnership)
 * that handlers call explicitly. This keeps the wrapper minimal and
 * makes tenant checks visible at every call site.
 */

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { requireAdmin } from '@/lib/admin-auth'
import { validateEdgeAuth, EdgeAuthError, type EdgeAuthResult } from '@/lib/auth/edge-auth'

// ─── Public types ──────────────────────────────────────────────────

export type AuthMode = 'admin' | 'session' | 'edge' | 'public'

/** Resolves to the auth result for the given mode. */
export type AuthFor<M extends AuthMode> =
  M extends 'admin' ? Session
  : M extends 'session' ? Session
  : M extends 'edge' ? EdgeAuthResult
  : null

export interface HandlerContext<
  TParams,
  TBody,
  M extends AuthMode,
> {
  req: NextRequest
  params: TParams
  body: TBody
  auth: AuthFor<M>
}

export interface DefineHandlerOptions<
  TParams,
  TBody,
  M extends AuthMode,
> {
  auth: M
  paramsSchema?: z.ZodType<TParams>
  bodySchema?: z.ZodType<TBody>
}

/**
 * Throw from within a handler to produce a typed error response.
 * The wrapper catches this and emits `{ error: message }` with the
 * given HTTP status.
 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

// ─── Internal: Next.js route context ───────────────────────────────

// Next 16 passes params as a Promise. The wrapper awaits it.
type RouteContext<TParams> = {
  params: Promise<TParams>
}

// ─── Implementation ────────────────────────────────────────────────

export function defineHandler<
  TParams = Record<string, string>,
  TBody = undefined,
  M extends AuthMode = 'session',
>(
  options: DefineHandlerOptions<TParams, TBody, M>,
  handler: (
    ctx: HandlerContext<TParams, TBody, M>,
  ) => Promise<Response | unknown>,
): (req: NextRequest, routeCtx: RouteContext<TParams>) => Promise<Response> {
  return async (req, routeCtx) => {
    try {
      // 1. Auth
      const authResult = await runAuth(options.auth, req)
      // runAuth returns either the auth value or a short-circuit Response
      // (for admin mode's 401/403 response from requireAdmin).
      if (authResult instanceof Response) return authResult

      // 2. Params (Next 16 passes a Promise)
      const rawParams = await routeCtx.params
      const params = options.paramsSchema
        ? options.paramsSchema.parse(rawParams)
        : (rawParams as TParams)

      // 3. Body (only if a schema was given — avoids unnecessary req.json())
      let body: TBody = undefined as unknown as TBody
      if (options.bodySchema) {
        const raw = await req.json()
        body = options.bodySchema.parse(raw)
      }

      // 4. Run user handler
      const result = await handler({
        req,
        params,
        body,
        auth: authResult as AuthFor<M>,
      })

      // 5. Pass through Response (for streaming, FormData, custom headers)
      if (result instanceof Response) return result

      // 6. Otherwise emit JSON
      return NextResponse.json(result)
    } catch (err) {
      return errorResponse(err)
    }
  }
}

// ─── Auth dispatcher ───────────────────────────────────────────────

async function runAuth(
  mode: AuthMode,
  req: NextRequest,
): Promise<Session | EdgeAuthResult | null | Response> {
  switch (mode) {
    case 'admin': {
      const guard = await requireAdmin()
      if ('error' in guard) return guard.error
      return guard.session as Session
    }
    case 'session': {
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return session
    }
    case 'edge': {
      // validateEdgeAuth throws EdgeAuthError on failure. The catch in
      // defineHandler converts it to a typed response.
      return await validateEdgeAuth(req)
    }
    case 'public':
      return null
    default: {
      // Exhaustiveness check. If a future AuthMode is added without
      // updating runAuth, TypeScript fails here.
      const _exhaustive: never = mode
      throw new Error(`Unknown auth mode: ${String(_exhaustive)}`)
    }
  }
}

// ─── Error dispatcher ──────────────────────────────────────────────

function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err instanceof EdgeAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', issues: err.issues },
      { status: 400 },
    )
  }
  // Anything else is an unhandled exception — log it and return 500.
  console.error('Route handler error:', err)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  )
}
