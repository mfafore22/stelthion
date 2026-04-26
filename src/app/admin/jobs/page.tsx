import prisma from '@/app/lib/prisma';
import { AdminJobsClient } from './client';

export default async function AdminJobsPage() {
  const jobs = await prisma.analysisJob.findMany({
    include: { camera: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const serialized = jobs.map((j) => ({
    id: j.id,
    cameraLabel: j.camera?.label ?? '–',
    footageDate: j.footageDate.toISOString(),
    startTime: j.startTime,
    endTime: j.endTime,
    journeyCount: j.journeyCount,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
  }));

  return <AdminJobsClient jobs={serialized} />;
}
