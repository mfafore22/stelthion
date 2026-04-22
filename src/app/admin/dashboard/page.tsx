import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/prisma';
import * as analysisJobRepo from '@/server/repositories/analysis-job';
import { AdminDashboardClient } from './client';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.customerId) redirect('/login');

  const callerCustomerId = session.user.customerId;

  // FloorplanZone and Camera both scope via mallId -> mall.customerId;
  // a dedicated floorplanRepo lands in the Phase E floorplan slice —
  // until then the tenant filter is inlined here so this admin tile
  // stops leaking cross-customer totals.
  const mallScope = { mall: { customerId: callerCustomerId } };

  const [zoneCount, cameraCount, jobCounts] = await Promise.all([
    prisma.floorplanZone.count({ where: mallScope }),
    prisma.camera.count({ where: mallScope }),
    analysisJobRepo.countByStatusForCaller(session),
  ]);

  const pending = jobCounts.find((j) => j.status === 'PENDING')?._count ?? 0;
  const processing = jobCounts.find((j) => j.status === 'PROCESSING')?._count ?? 0;
  const complete = jobCounts.find((j) => j.status === 'COMPLETE')?._count ?? 0;

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
