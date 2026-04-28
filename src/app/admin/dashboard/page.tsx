import prisma from '@/app/lib/prisma';
import { activeCustomerMallIds } from '@/lib/admin-customer';
import { AdminDashboardClient } from './client';

export default async function AdminDashboard() {
  const mallIds = (await activeCustomerMallIds()) ?? [];
  const mallScope = { mallId: { in: mallIds } };

  const [zoneCount, cameraCount, jobCounts] = await Promise.all([
    prisma.floorplanZone.count({ where: mallScope }),
    prisma.camera.count({ where: mallScope }),
    prisma.analysisJob.groupBy({
      by: ['status'],
      _count: true,
      where: mallScope,
    }),
  ]);

  const pending = jobCounts.find((j: { status: string }) => j.status === 'PENDING')?._count ?? 0;
  const processing = jobCounts.find((j: { status: string }) => j.status === 'PROCESSING')?._count ?? 0;
  const complete = jobCounts.find((j: { status: string }) => j.status === 'COMPLETE')?._count ?? 0;

  return (
    <AdminDashboardClient
      zoneCount={zoneCount}
      cameraCount={cameraCount}
      pending={pending}
      processing={processing}
      complete={complete}
    />
  );
}