/**
 * @jest-environment node
 *
 * Phase A.5 parity test — locks in current edge-device authentication
 * behavior (src/lib/auth/edge-auth.ts).
 *
 * If a future refactor changes the tenant-binding rule, the magic
 * status codes, or the bcrypt verification flow, this suite fails
 * loudly so the change must be deliberate.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import bcrypt from 'bcrypt'

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    edgeDevice: {
      findUnique: jest.fn(),
    },
  },
}))

import prisma from '@/server/db/client'
import { validateEdgeAuth, EdgeAuthError } from '@/lib/auth/edge-auth'
import type { NextRequest } from 'next/server'

const findUniqueMock = (prisma as any).edgeDevice.findUnique as jest.Mock

function makeReq(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null
      },
    },
  } as unknown as NextRequest
}

const VALID_API_KEY = 'edge-test-key-12345'

beforeEach(() => {
  findUniqueMock.mockReset()
})

describe('validateEdgeAuth — header guards', () => {
  it('rejects missing Authorization header (401)', async () => {
    const req = makeReq({ 'x-edge-id': 'edge1', 'x-mall-id': 'ideapark1' })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Authorization'),
    })
  })

  it('rejects non-Bearer Authorization header (401)', async () => {
    const req = makeReq({
      authorization: 'Basic abc123',
      'x-edge-id': 'edge1',
      'x-mall-id': 'ideapark1',
    })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects missing X-Edge-Id (401)', async () => {
    const req = makeReq({
      authorization: 'Bearer x',
      'x-mall-id': 'ideapark1',
    })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('X-Edge-Id'),
    })
  })

  it('rejects missing X-Mall-Id (401)', async () => {
    const req = makeReq({
      authorization: 'Bearer x',
      'x-edge-id': 'edge1',
    })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({ status: 401 })
  })
})

describe('validateEdgeAuth — device lookup & tenant binding', () => {
  it('rejects unknown edge device (401)', async () => {
    findUniqueMock.mockResolvedValue(null)
    const req = makeReq({
      authorization: `Bearer ${VALID_API_KEY}`,
      'x-edge-id': 'ghost',
      'x-mall-id': 'ideapark1',
    })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({
      status: 401,
      message: 'Unknown edge device',
    })
  })

  it('rejects when device is bound to a different mall (403 — tenant binding)', async () => {
    const apiKeyHash = await bcrypt.hash(VALID_API_KEY, 10)
    findUniqueMock.mockResolvedValue({
      id: 'dev-id',
      edgeId: 'edge1',
      mallId: 'mall-A', // device belongs to A
      apiKeyHash,
    })
    const req = makeReq({
      authorization: `Bearer ${VALID_API_KEY}`,
      'x-edge-id': 'edge1',
      'x-mall-id': 'mall-B', // request claims B
    })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({
      status: 403,
      message: 'Edge device not authorized for this mall',
    })
  })

  it('rejects when API key does not match stored hash (401)', async () => {
    const apiKeyHash = await bcrypt.hash('correct-secret', 10)
    findUniqueMock.mockResolvedValue({
      id: 'dev-id',
      edgeId: 'edge1',
      mallId: 'ideapark1',
      apiKeyHash,
    })
    const req = makeReq({
      authorization: `Bearer wrong-secret`,
      'x-edge-id': 'edge1',
      'x-mall-id': 'ideapark1',
    })
    await expect(validateEdgeAuth(req)).rejects.toMatchObject({
      status: 401,
      message: 'Invalid API key',
    })
  })

  it('returns auth result on full success (edgeId, mallId, deviceId)', async () => {
    const apiKeyHash = await bcrypt.hash(VALID_API_KEY, 10)
    findUniqueMock.mockResolvedValue({
      id: 'internal-uuid-1',
      edgeId: 'edge1',
      mallId: 'ideapark1',
      apiKeyHash,
    })
    const req = makeReq({
      authorization: `Bearer ${VALID_API_KEY}`,
      'x-edge-id': 'edge1',
      'x-mall-id': 'ideapark1',
    })
    const result = await validateEdgeAuth(req)
    expect(result).toEqual({
      edgeId: 'edge1',
      mallId: 'ideapark1',
      deviceId: 'internal-uuid-1',
    })
  })
})

describe('EdgeAuthError', () => {
  it('preserves status code and is named EdgeAuthError', () => {
    const err = new EdgeAuthError(403, 'denied')
    expect(err.status).toBe(403)
    expect(err.name).toBe('EdgeAuthError')
    expect(err.message).toBe('denied')
    expect(err).toBeInstanceOf(Error)
  })
})
