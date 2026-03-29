import { NextRequest } from 'next/server'
import prisma from '@/app/lib/prisma'
import bcrypt from 'bcrypt'

export interface EdgeAuthResult {
  edgeId: string
  mallId: string
  deviceId: string
}

/**
 * Validate edge device authentication via API key.
 * Expects:
 *   Authorization: Bearer <EDGE_API_KEY>
 *   X-Edge-Id: <edge-unit-id>
 *   X-Mall-Id: <mall-slug>
 */
export async function validateEdgeAuth(req: NextRequest): Promise<EdgeAuthResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new EdgeAuthError(401, 'Missing or invalid Authorization header')
  }

  const apiKey = authHeader.slice(7)
  const edgeId = req.headers.get('x-edge-id')
  const mallId = req.headers.get('x-mall-id')

  if (!edgeId || !mallId) {
    throw new EdgeAuthError(401, 'Missing X-Edge-Id or X-Mall-Id header')
  }

  const device = await prisma.edgeDevice.findUnique({
    where: { edgeId },
  })

  if (!device) {
    throw new EdgeAuthError(401, 'Unknown edge device')
  }

  if (device.mallId !== mallId) {
    throw new EdgeAuthError(403, 'Edge device not authorized for this mall')
  }

  const valid = await bcrypt.compare(apiKey, device.apiKeyHash)
  if (!valid) {
    throw new EdgeAuthError(401, 'Invalid API key')
  }

  return {
    edgeId: device.edgeId,
    mallId: device.mallId,
    deviceId: device.id,
  }
}

export class EdgeAuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'EdgeAuthError'
  }
}
