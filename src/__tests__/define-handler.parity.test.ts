/**
 * @jest-environment node
 *
 * Phase B parity test — defineHandler wrapper.
 *
 * defineHandler is the canonical wrapper for Next.js API route handlers.
 * It owns four cross-cutting concerns: auth, schema validation, error
 * handling, and response shape. These tests pin every branch of every
 * concern so future refactors of route files can lean on the wrapper
 * without re-testing each concern at every call site.
 *
 * Coverage map:
 *   - auth='public'         — handler runs, ctx.auth is null
 *   - auth='session' (ok)   — handler receives session
 *   - auth='session' (none) — 401 short-circuit
 *   - auth='admin' (ok)     — handler receives session
 *   - auth='admin' (forbid) — Response from requireAdmin returned as-is
 *   - auth='edge' (ok)      — handler receives EdgeAuthResult
 *   - auth='edge' (fail)    — EdgeAuthError caught, typed response emitted
 *   - paramsSchema (ok)     — params parsed and typed
 *   - paramsSchema (bad)    — ZodError → 400 with issues
 *   - bodySchema (ok)       — body parsed
 *   - bodySchema (bad)      — ZodError → 400
 *   - bodySchema absent     — req.json() never called
 *   - HttpError thrown      — typed JSON response with status
 *   - generic error thrown  — 500 with internal-error message
 *   - Response returned     — passed through (streaming, FormData, etc.)
 *   - non-Response returned — wrapped in NextResponse.json
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/admin-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/auth/edge-auth', () => {
  class EdgeAuthError extends Error {
    constructor(public status: number, message: string) {
      super(message)
      this.name = 'EdgeAuthError'
    }
  }
  return {
    EdgeAuthError,
    validateEdgeAuth: jest.fn(),
  }
})

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { defineHandler, HttpError } from '@/server/api/define-handler'
import { auth } from '@/auth'
import { requireAdmin } from '@/lib/admin-auth'
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth'

const authMock = auth as unknown as jest.Mock
const requireAdminMock = requireAdmin as unknown as jest.Mock
const validateEdgeAuthMock = validateEdgeAuth as unknown as jest.Mock

function makeReq(opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): NextRequest {
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: opts.headers,
  }
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body)
    init.headers = { 'content-type': 'application/json', ...(opts.headers ?? {}) }
  }
  return new NextRequest('http://localhost/api/test', init)
}

function makeCtx<TParams>(params: TParams): { params: Promise<TParams> } {
  return { params: Promise.resolve(params) }
}

beforeEach(() => {
  authMock.mockReset()
  requireAdminMock.mockReset()
  validateEdgeAuthMock.mockReset()
})

// ─── auth='public' ───────────────────────────────────────────────

describe('defineHandler — auth=public', () => {
  it('runs handler with auth=null and never calls auth helpers', async () => {
    const handler = jest.fn().mockResolvedValue({ ok: true })
    const route = defineHandler({ auth: 'public' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].auth).toBeNull()
    expect(authMock).not.toHaveBeenCalled()
    expect(requireAdminMock).not.toHaveBeenCalled()
    expect(validateEdgeAuthMock).not.toHaveBeenCalled()
  })
})

// ─── auth='session' ──────────────────────────────────────────────

describe('defineHandler — auth=session', () => {
  it('passes the session into the handler when authenticated', async () => {
    const session = { user: { id: 'u1', customerId: 'cust-1' } }
    authMock.mockResolvedValue(session)
    const handler = jest.fn().mockResolvedValue({ ok: true })

    const route = defineHandler({ auth: 'session' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(handler.mock.calls[0][0].auth).toBe(session)
  })

  it('returns 401 when there is no session', async () => {
    authMock.mockResolvedValue(null)
    const handler = jest.fn()

    const route = defineHandler({ auth: 'session' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 401 when session has no user', async () => {
    authMock.mockResolvedValue({})
    const handler = jest.fn()

    const route = defineHandler({ auth: 'session' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})

// ─── auth='admin' ────────────────────────────────────────────────

describe('defineHandler — auth=admin', () => {
  it('passes the admin session into the handler when requireAdmin succeeds', async () => {
    const session = { user: { id: 'u1', role: 'ADMIN', customerId: 'cust-1' } }
    requireAdminMock.mockResolvedValue({ session })
    const handler = jest.fn().mockResolvedValue({ ok: true })

    const route = defineHandler({ auth: 'admin' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(handler.mock.calls[0][0].auth).toBe(session)
  })

  it('short-circuits with the Response from requireAdmin on failure', async () => {
    const errResponse = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    requireAdminMock.mockResolvedValue({ error: errResponse })
    const handler = jest.fn()

    const route = defineHandler({ auth: 'admin' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res).toBe(errResponse)
    expect(res.status).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })
})

// ─── auth='edge' ─────────────────────────────────────────────────

describe('defineHandler — auth=edge', () => {
  it('passes the EdgeAuthResult into the handler on success', async () => {
    const edge = { edgeId: 'edge-1', mallId: 'mall-a', deviceId: 'd1' }
    validateEdgeAuthMock.mockResolvedValue(edge)
    const handler = jest.fn().mockResolvedValue({ ok: true })

    const route = defineHandler({ auth: 'edge' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(handler.mock.calls[0][0].auth).toEqual(edge)
  })

  it('catches EdgeAuthError and emits a typed response', async () => {
    validateEdgeAuthMock.mockRejectedValue(new EdgeAuthError(401, 'Invalid API key'))
    const handler = jest.fn()

    const route = defineHandler({ auth: 'edge' }, handler)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid API key' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('preserves the 403 status from EdgeAuthError on tenant mismatch', async () => {
    validateEdgeAuthMock.mockRejectedValue(
      new EdgeAuthError(403, 'Edge device not authorized for this mall'),
    )
    const route = defineHandler({ auth: 'edge' }, jest.fn())
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(403)
  })
})

// ─── paramsSchema ────────────────────────────────────────────────

describe('defineHandler — paramsSchema', () => {
  beforeEach(() => authMock.mockResolvedValue({ user: { id: 'u1' } }))

  it('parses and types params when schema is given', async () => {
    const handler = jest.fn().mockResolvedValue({ ok: true })
    const route = defineHandler(
      { auth: 'session', paramsSchema: z.object({ id: z.string() }) },
      handler,
    )
    await route(makeReq(), makeCtx({ id: 'abc' }))

    expect(handler.mock.calls[0][0].params).toEqual({ id: 'abc' })
  })

  it('returns 400 with zod issues on invalid params', async () => {
    const handler = jest.fn()
    const route = defineHandler(
      { auth: 'session', paramsSchema: z.object({ id: z.string().uuid() }) },
      handler,
    )
    const res = await route(makeReq(), makeCtx({ id: 'not-a-uuid' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Validation failed')
    expect(Array.isArray(body.issues)).toBe(true)
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes raw params through when no schema is supplied', async () => {
    const handler = jest.fn().mockResolvedValue({ ok: true })
    const route = defineHandler({ auth: 'session' }, handler)
    await route(makeReq(), makeCtx({ id: 'abc', extra: 'untouched' }))

    expect(handler.mock.calls[0][0].params).toEqual({ id: 'abc', extra: 'untouched' })
  })
})

// ─── bodySchema ──────────────────────────────────────────────────

describe('defineHandler — bodySchema', () => {
  beforeEach(() => authMock.mockResolvedValue({ user: { id: 'u1' } }))

  it('parses and types body when schema is given', async () => {
    const handler = jest.fn().mockResolvedValue({ ok: true })
    const route = defineHandler(
      { auth: 'session', bodySchema: z.object({ name: z.string() }) },
      handler,
    )
    await route(makeReq({ method: 'POST', body: { name: 'alice' } }), makeCtx({}))

    expect(handler.mock.calls[0][0].body).toEqual({ name: 'alice' })
  })

  it('returns 400 with zod issues on invalid body', async () => {
    const handler = jest.fn()
    const route = defineHandler(
      { auth: 'session', bodySchema: z.object({ name: z.string() }) },
      handler,
    )
    const res = await route(
      makeReq({ method: 'POST', body: { name: 12345 } }),
      makeCtx({}),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Validation failed')
    expect(handler).not.toHaveBeenCalled()
  })

  it('skips req.json() entirely when no bodySchema is supplied', async () => {
    const handler = jest.fn().mockResolvedValue({ ok: true })
    const route = defineHandler({ auth: 'session' }, handler)

    // Build a request whose .json() would throw if called
    const req = new NextRequest('http://localhost/api/test', { method: 'GET' })
    const jsonSpy = jest.spyOn(req, 'json').mockRejectedValue(new Error('should not be called'))

    const res = await route(req, makeCtx({}))

    expect(res.status).toBe(200)
    expect(handler.mock.calls[0][0].body).toBeUndefined()
    expect(jsonSpy).not.toHaveBeenCalled()
  })
})

// ─── Error handling ──────────────────────────────────────────────

describe('defineHandler — error handling', () => {
  beforeEach(() => authMock.mockResolvedValue({ user: { id: 'u1' } }))

  it('converts thrown HttpError into typed JSON response', async () => {
    const route = defineHandler({ auth: 'session' }, async () => {
      throw new HttpError(404, 'Customer not found')
    })
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Customer not found' })
  })

  it('preserves arbitrary HttpError statuses (e.g. 403, 422)', async () => {
    const route403 = defineHandler({ auth: 'session' }, async () => {
      throw new HttpError(403, 'Forbidden')
    })
    expect((await route403(makeReq(), makeCtx({}))).status).toBe(403)

    const route422 = defineHandler({ auth: 'session' }, async () => {
      throw new HttpError(422, 'Unprocessable')
    })
    expect((await route422(makeReq(), makeCtx({}))).status).toBe(422)
  })

  it('catches EdgeAuthError thrown from inside the handler too', async () => {
    const route = defineHandler({ auth: 'session' }, async () => {
      throw new EdgeAuthError(401, 'edge token expired')
    })
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'edge token expired' })
  })

  it('returns 500 with generic message on unhandled exceptions', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const route = defineHandler({ auth: 'session' }, async () => {
      throw new Error('something blew up')
    })
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})

// ─── Response shape ──────────────────────────────────────────────

describe('defineHandler — response shape', () => {
  beforeEach(() => authMock.mockResolvedValue({ user: { id: 'u1' } }))

  it('passes through a Response returned by the handler unchanged', async () => {
    const passthrough = new Response('raw body', {
      status: 201,
      headers: { 'x-custom': 'yes' },
    })
    const route = defineHandler({ auth: 'session' }, async () => passthrough)
    const res = await route(makeReq(), makeCtx({}))

    expect(res).toBe(passthrough)
    expect(res.status).toBe(201)
    expect(res.headers.get('x-custom')).toBe('yes')
  })

  it('wraps a plain object in NextResponse.json with status 200', async () => {
    const route = defineHandler({ auth: 'session' }, async () => ({
      hello: 'world',
    }))
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ hello: 'world' })
  })

  it('wraps null in NextResponse.json (handler can return null)', async () => {
    const route = defineHandler({ auth: 'session' }, async () => null)
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('wraps an array in NextResponse.json', async () => {
    const route = defineHandler({ auth: 'session' }, async () => [1, 2, 3])
    const res = await route(makeReq(), makeCtx({}))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([1, 2, 3])
  })
})

// ─── HttpError shape ─────────────────────────────────────────────

describe('HttpError', () => {
  it('exposes status and message and is an Error subclass', () => {
    const err = new HttpError(404, 'not found')
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(404)
    expect(err.message).toBe('not found')
    expect(err.name).toBe('HttpError')
  })
})
