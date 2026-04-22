import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import * as analysisJobRepo from '@/server/repositories/analysis-job';
import * as floorplanRepo from '@/server/repositories/floorplan';
import { AdminDashboardClient } from './client';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.customerId) redirect('/login');

  const [zoneCount, cameraCount, jobCounts] = await Promise.all([
    floorplanRepo.countZonesForCaller(session),
    floorplanRepo.countCamerasForCaller(session),
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
