import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import * as analysisJobRepo from '@/server/repositories/analysis-job';
import { AdminJobsClient } from './client';

export default async function AdminJobsPage() {
  const session = await auth();
  if (!session?.user?.customerId) redirect('/login');

  const jobs = await analysisJobRepo.listForCaller(session, {
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const serialized = jobs.map((j) => ({
    id: j.id,
    cameraLabel: j.camera?.label ?? '—',
    footageDate: j.footageDate.toISOString(),
    startTime: j.startTime,
    endTime: j.endTime,
    journeyCount: j.journeyCount,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
  }));

  return <AdminJobsClient jobs={serialized} />;
}
