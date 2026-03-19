/**
 * Floorplan backup service — snapshot current DB state before destructive saves.
 * Keeps the last 20 snapshots per mall+floor; older ones are pruned automatically.
 */
import type { PrismaClient } from '@prisma/client';

const MAX_SNAPSHOTS = 20;

/**
 * Save a full snapshot of zones and cameras for a given mall+floor.
 * Call this BEFORE any deleteMany/create cycle.
 */
export async function createFloorplanSnapshot(
  prisma: PrismaClient,
  mallId: string,
  floor: string,
  reason = 'pre-save',
) {
  const [zones, cameras] = await Promise.all([
    prisma.floorplanZone.findMany({ where: { mallId, floor } }),
    prisma.camera.findMany({ where: { mallId, floor } }),
  ]);

  // Only snapshot if there's actual data to preserve
  if (zones.length === 0 && cameras.length === 0) {
    return null;
  }

  const snapshot = await prisma.floorplanSnapshot.create({
    data: {
      mallId,
      floor,
      reason,
      data: JSON.stringify({ zones, cameras }),
    },
  });

  // Prune old snapshots beyond MAX_SNAPSHOTS
  const all = await prisma.floorplanSnapshot.findMany({
    where: { mallId, floor },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (all.length > MAX_SNAPSHOTS) {
    const toDelete = all.slice(MAX_SNAPSHOTS).map((s) => s.id);
    await prisma.floorplanSnapshot.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return snapshot;
}
