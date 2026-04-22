/**
 * GET /api/admin/verification/training-pairs
 *
 * Exports labeled color-signature pairs from this customer's verification
 * reviews — used by the edge re-ID pipeline to calibrate matching
 * thresholds. Contains no personal data, only hex color arrays and a
 * boolean indicating same_individual.
 *
 * Phase D — admin group migration. Pre-Phase-D this route was admin-gated
 * but did NOT scope reviews to the calling admin's customer. A tenant
 * admin could extract every other tenant's labeled training pairs by
 * hitting this endpoint, getting cross-customer ground-truth data they
 * could feed into their own re-ID model. Now scoped to reviews on jobs
 * whose mall belongs to the caller's customer.
 */

import prisma from '@/server/db/client';
import { defineHandler } from '@/server/api/define-handler';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ auth: session }) => {
    const callerCustomerId = session.user.customerId;

    // Phase D scope: reviews only from jobs owned by this customer.
    // The job filter goes through the relation: job.mall.customerId.
    const reviews = await prisma.verificationReview.findMany({
      where: {
        verdict: { in: ['match', 'mismatch'] },
        job: { mall: { customerId: callerCustomerId } },
      },
      select: {
        jobId: true,
        anonymousTagId: true,
        verdict: true,
      },
    });

    const pairs: {
      colorSigA: string[];
      colorSigB: string[];
      sameIndividual: boolean;
    }[] = [];

    // For each reviewed individual, get their snapshot color signatures
    // and create pairs from consecutive snapshots.
    for (const review of reviews) {
      const snapshots = await prisma.verificationSnapshot.findMany({
        where: {
          jobId: review.jobId,
          anonymousTagId: review.anonymousTagId,
          // Defense-in-depth: even if an attacker somehow injects a
          // foreign jobId, the snapshot scope is also gated on the
          // job's mall.customerId.
          job: { mall: { customerId: callerCustomerId } },
        },
        orderBy: { sequenceIndex: 'asc' },
        select: { colorSignature: true },
      });

      if (snapshots.length < 2) continue;

      const sameIndividual = review.verdict === 'match';
      for (let i = 0; i < snapshots.length - 1; i++) {
        const sigA = parseColorSig(snapshots[i].colorSignature);
        const sigB = parseColorSig(snapshots[i + 1].colorSignature);
        if (sigA && sigB) {
          pairs.push({ colorSigA: sigA, colorSigB: sigB, sameIndividual });
        }
      }
    }

    return { pairs, count: pairs.length };
  },
);

function parseColorSig(raw: string): string[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((c: unknown) => typeof c === 'string')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
