import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireMallAccess } from '@/lib/admin-customer';

const PATCHABLE = [
  'label', 'angleDeg', 'fovDeg', 'rangeM', 'streamUrl',
  'active', 'model', 'resolution', 'lensInfo',
  'cameraRole', 'zoneDbId', 'homographyMatrix',
] as const;

function pick(obj: Record<string, unknown>, keys: readonly string[]) {
  return Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string; cameraId: string }> },
) {
  const { mallId, cameraId } = await params;
  const guard = await requireMallAccess(mallId);
  if ('error' in guard) return guard.error;

  const existing = await prisma.camera.findUnique({ where: { id: cameraId } });
  if (!existing || existing.mallId !== mallId) {
    return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
  }

  const body = await req.json();
  const data = pick(body, PATCHABLE);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await prisma.camera.update({ where: { id: cameraId }, data });
  return NextResponse.json(updated);
}
