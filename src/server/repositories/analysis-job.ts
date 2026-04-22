/**
 * analysisJobRepo — data access for the AnalysisJob model with tenant
 * scoping baked in.
 *
 * An AnalysisJob is owned transitively via its Mall (`job.mall.customerId`).
 * Pre-Phase-D three analysis routes trusted any authenticated session
 * with a valid jobId, allowing a tenant user to read another tenant's
 * analysis results / journeys / insights by guessing a cuid. The repo
 * bakes the ownership check into `assertOwnership`, and the list
 * helper forces every findMany to include a customer-scoped filter.
 *
 * Edge writers (src/app/api/edge/**) authenticate via a signed
 * device JWT, not session, and scope by `job.mallId === auth.mallId`.
 * They do NOT use this module — their ownership model is different.
 */

import type { Session } from 'next-auth';
import type { AnalysisJob, Prisma } from '@prisma/client';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';

function requireCallerCustomerId(session: Session): string {
  const callerCustomerId = session.user?.customerId;
  if (!callerCustomerId) {
    throw new HttpError(401, 'Unauthorized');
  }
  return callerCustomerId;
}

/**
 * Assert the calling session owns the analysis job with the given id.
 * Returns the owning customerId on success.
 *
 * Throws HttpError(404) if the job doesn't exist, HttpError(403) if it
 * belongs to a different customer, HttpError(401) if the session has no
 * customerId.
 */
export async function assertOwnership(
  session: Session,
  jobId: string,
): Promise<string> {
  const callerCustomerId = requireCallerCustomerId(session);

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    select: { mall: { select: { customerId: true } } },
  });

  if (!job) throw new HttpError(404, 'Job not found');
  if (!job.mall || job.mall.customerId !== callerCustomerId) {
    throw new HttpError(403, 'Forbidden');
  }
  return job.mall.customerId;
}

/**
 * List analysis jobs visible to the calling session. The caller's
 * `where` clause is always augmented with `mall.customerId === callerCustomerId`,
 * so a forgotten tenant filter can't leak cross-customer jobs.
 *
 * The generic over `include` lets callers pick their own eager-load
 * shape while keeping the return type precise.
 */
export async function listForCaller<
  I extends Prisma.AnalysisJobInclude = Prisma.AnalysisJobInclude,
>(
  session: Session,
  opts: {
    where?: Prisma.AnalysisJobWhereInput;
    include?: I;
    orderBy?:
      | Prisma.AnalysisJobOrderByWithRelationInput
      | Prisma.AnalysisJobOrderByWithRelationInput[];
    take?: number;
  } = {},
): Promise<Array<Prisma.AnalysisJobGetPayload<{ include: I }>>> {
  const callerCustomerId = requireCallerCustomerId(session);

  const callerMallWhere = opts.where?.mall;
  const mergedMallWhere: Prisma.MallWhereInput =
    callerMallWhere && typeof callerMallWhere === 'object' && !Array.isArray(callerMallWhere)
      ? { ...(callerMallWhere as Prisma.MallWhereInput), customerId: callerCustomerId }
      : { customerId: callerCustomerId };

  const scopedWhere: Prisma.AnalysisJobWhereInput = {
    ...opts.where,
    mall: mergedMallWhere,
  };

  return prisma.analysisJob.findMany({
    where: scopedWhere,
    include: opts.include,
    orderBy: opts.orderBy,
    take: opts.take,
  }) as Promise<Array<Prisma.AnalysisJobGetPayload<{ include: I }>>>;
}

export type { AnalysisJob };
