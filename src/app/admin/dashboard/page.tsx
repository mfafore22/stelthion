import prisma from '@/app/lib/prisma';
import { AdminDashboardClient } from './client';

export default async function AdminDashboard() {
  const [zoneCount, storeCount, cameraCount, jobCounts] = await Promise.all([
    prisma.floorplanZone.count(),
    prisma.floorplanStore.count(),
    prisma.camera.count(),
    prisma.analysisJob.groupBy({ by: ['status'], _count: true }),
  ]);

  const pending = jobCounts.find((j) => j.status === 'PENDING')?._count ?? 0;
  const processing = jobCounts.find((j) => j.status === 'PROCESSING')?._count ?? 0;
  const complete = jobCounts.find((j) => j.status === 'COMPLETE')?._count ?? 0;

  return (
    <AdminDashboardClient
      zoneCount={zoneCount}
      storeCount={storeCount}
      cameraCount={cameraCount}
      pending={pending}
      processing={processing}
      complete={complete}
    />
  );
}
