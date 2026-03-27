import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { createFloorplanSnapshot } from '@/lib/services/floorplanBackup';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mallId } = await params;
  const floor = new URL(req.url).searchParams.get('floor') ?? 'ground';

  const snapshots = await prisma.floorplanSnapshot.findMany({
    where: { mallId, floor },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      reason: true,
      createdAt: true,
    },
  });

  const list = snapshots.map((s) => ({
    id: s.id,
    reason: s.reason,
    createdAt: s.createdAt,
  }));

  return NextResponse.json(list);
}

interface LegacyStore {
  id: string; mallId: string; floor: string; name: string; slug: string;
  zoneDbId: string; x: number; y: number; w: number; h: number;
  publishedAt?: string | null;
}

function convertLegacyStores(stores: LegacyStore[]) {
  return stores.map((s) => ({
    id: s.id,
    mallId: s.mallId,
    floor: s.floor,
    zoneId: `store-${s.slug}`,
    name: s.name,
    nameFi: s.name,
    category: 'Store',
    subcategory: null,
    drawShape: 'rect',
    svgPoints: `${s.x},${s.y} ${s.x + s.w},${s.y} ${s.x + s.w},${s.y + s.h} ${s.x},${s.y + s.h}`,
    labelX: Math.round(s.x + s.w / 2),
    labelY: Math.round(s.y + s.h / 2),
    capacity: 0,
    areaSqm: 0,
    baseVisitors: 0,
    publishedAt: s.publishedAt ?? null,
  }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mallId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mallId } = await params;
  const { snapshotId } = await req.json();

  const snapshot = await prisma.floorplanSnapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot || snapshot.mallId !== mallId) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  const parsed = JSON.parse(snapshot.data);
  let zones = parsed.zones ?? [];
  if (parsed.stores?.length) {
    zones = [...zones, ...convertLegacyStores(parsed.stores)];
  }
  const cameras = parsed.cameras ?? [];

  await createFloorplanSnapshot(prisma, mallId, snapshot.floor, 'pre-restore');

  try {
    await prisma.$transaction(async (tx) => {
      await tx.camera.deleteMany({ where: { mallId, floor: snapshot.floor } });
      await tx.floorplanZone.deleteMany({ where: { mallId, floor: snapshot.floor } });

      for (const z of zones) {
        await tx.floorplanZone.create({
          data: {
            mallId: z.mallId ?? mallId,
            floor: z.floor ?? snapshot.floor,
            zoneId: z.zoneId,
            name: z.name,
            nameFi: z.nameFi,
            category: z.category,
            subcategory: z.subcategory ?? null,
            drawShape: z.drawShape ?? 'polygon',
            svgPoints: z.svgPoints,
            labelX: z.labelX,
            labelY: z.labelY,
            capacity: z.capacity,
            areaSqm: z.areaSqm,
            baseVisitors: z.baseVisitors ?? 0,
            publishedAt: z.publishedAt ? new Date(z.publishedAt) : null,
          },
        });
      }

      for (const c of cameras) {
        await tx.camera.create({
          data: {
            mallId: c.mallId ?? mallId,
            floor: c.floor ?? snapshot.floor,
            label: c.label,
            x: c.x,
            y: c.y,
            angleDeg: c.angleDeg ?? null,
            fovDeg: c.fovDeg ?? null,
            rangeM: c.rangeM ?? null,
            streamUrl: c.streamUrl ?? null,
            active: c.active ?? true,
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      restored: {
        zones: zones.length,
        cameras: cameras.length,
      },
    });
  } catch (error) {
    console.error('Snapshot restore error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Restore failed' },
      { status: 500 },
    );
  }
}