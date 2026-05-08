import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { activeCustomerMallIds } from '@/lib/admin-customer';

/**
 * GET /api/admin/verification/training-pairs
 * Exports labeled color-signature pairs for edge re-ID threshold calibration.
 *
 * For each "match" or "mismatch" verdict, produces pairs of color signatures
 * from the snapshot sequence. Contains NO personal data — only hex color arrays
 * and a boolean indicating same_individual.
 */
export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const mallIds = await activeCustomerMallIds();
  if (!mallIds) {
    return NextResponse.json({ error: 'No active customer' }, { status: 409 });
  }

  // Fetch all reviews with a definitive verdict (exclude "unsure"), scoped to
  // jobs owned by malls in the active customer.
  const reviews = await prisma.verificationReview.findMany({
    where: {
      verdict: { in: ['match', 'mismatch'] },
      job: { mallId: { in: mallIds } },
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

  // For each reviewed individual, get their snapshot color signatures and create pairs
  for (const review of reviews) {
    const snapshots = await prisma.verificationSnapshot.findMany({
      where: {
        jobId: review.jobId,
        anonymousTagId: review.anonymousTagId,
      },
      orderBy: { sequenceIndex: 'asc' },
      select: { colorSignature: true },
    });

    if (snapshots.length < 2) continue;

    // Create pairs from consecutive snapshots
    const sameIndividual = review.verdict === 'match';
    for (let i = 0; i < snapshots.length - 1; i++) {
      const sigA = parseColorSig(snapshots[i].colorSignature);
      const sigB = parseColorSig(snapshots[i + 1].colorSignature);
      if (sigA && sigB) {
        pairs.push({ colorSigA: sigA, colorSigB: sigB, sameIndividual });
      }
    }
  }

  return NextResponse.json({ pairs, count: pairs.length });
}

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
