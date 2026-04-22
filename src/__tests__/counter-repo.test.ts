/**
 * @jest-environment node
 *
 * Phase E unit tests — counterRepo.
 *
 * mallRepo.assertOwnership is mocked so each test can control whether
 * the mall ownership check passes, and so its rejection surface is
 * isolated from this repo's contract (counterRepo throws the errors
 * that mallRepo throws — it does not translate them).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@/server/db/client', () => ({
  __esModule: true,
  default: {
    counterUpload: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    counterReading: {
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/server/repositories/mall', () => ({
  __esModule: true,
  assertOwnership: jest.fn(),
}));

jest.mock('@/auth', () => ({ auth: jest.fn() }));

import * as counterRepo from '@/server/repositories/counter';
import * as mallRepo from '@/server/repositories/mall';
import prisma from '@/server/db/client';
import { HttpError } from '@/server/api/define-handler';
import type { Session } from 'next-auth';

const uploadFindMany = (prisma as any).counterUpload.findMany as jest.Mock;
const uploadFindUnique = (prisma as any).counterUpload.findUnique as jest.Mock;
const uploadDelete = (prisma as any).counterUpload.delete as jest.Mock;
const readingGroupBy = (prisma as any).counterReading.groupBy as jest.Mock;
const readingDeleteMany = (prisma as any).counterReading.deleteMany as jest.Mock;
const assertOwnership = (mallRepo as any).assertOwnership as jest.Mock;

const sessionA: Session = {
  user: { id: 'u1', role: 'ADMIN', customerId: 'cust-A' },
} as Session;

beforeEach(() => {
  uploadFindMany.mockReset();
  uploadFindUnique.mockReset();
  uploadDelete.mockReset();
  readingGroupBy.mockReset();
  readingDeleteMany.mockReset();
  assertOwnership.mockReset();
});

// ─── listUploadsForMall ──────────────────────────────────────────────

describe('counterRepo.listUploadsForMall', () => {
  it('propagates mallRepo.assertOwnership failure (e.g. 403)', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      counterRepo.listUploadsForMall(sessionA, 'mall-X'),
    ).rejects.toMatchObject({ status: 403 });
    expect(uploadFindMany).not.toHaveBeenCalled();
  });

  it('queries uploads scoped to mallId, newest first, when ownership passes', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    uploadFindMany.mockResolvedValueOnce([{ id: 'u1' }]);
    await expect(
      counterRepo.listUploadsForMall(sessionA, 'mall-A'),
    ).resolves.toEqual([{ id: 'u1' }]);
    expect(assertOwnership).toHaveBeenCalledWith(sessionA, 'mall-A');
    expect(uploadFindMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A' },
      orderBy: { uploadedAt: 'desc' },
    });
  });
});

// ─── listLegacyWeekSummariesForMall ──────────────────────────────────

describe('counterRepo.listLegacyWeekSummariesForMall', () => {
  it('propagates mallRepo.assertOwnership failure', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(404, 'Not found'));
    await expect(
      counterRepo.listLegacyWeekSummariesForMall(sessionA, 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
    expect(readingGroupBy).not.toHaveBeenCalled();
  });

  it('groups by year/weekNumber/granularity filtered to uploadId:null', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    readingGroupBy.mockResolvedValueOnce([]);
    await counterRepo.listLegacyWeekSummariesForMall(sessionA, 'mall-A');
    expect(readingGroupBy).toHaveBeenCalledWith({
      by: ['year', 'weekNumber', 'granularity'],
      where: { mallId: 'mall-A', uploadId: null },
      _sum: { visitors: true },
      _count: { counterLabel: true },
      _max: { uploadedAt: true },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
  });
});

// ─── listWeeksPageDataForMall ────────────────────────────────────────

describe('counterRepo.listWeeksPageDataForMall', () => {
  it('propagates mallRepo.assertOwnership failure', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      counterRepo.listWeeksPageDataForMall(sessionA, 'mall-X'),
    ).rejects.toMatchObject({ status: 403 });
    expect(uploadFindMany).not.toHaveBeenCalled();
    expect(readingGroupBy).not.toHaveBeenCalled();
  });

  it('asserts ownership exactly once and returns both uploads and legacyWeeks', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    uploadFindMany.mockResolvedValueOnce([{ id: 'u1' }]);
    readingGroupBy.mockResolvedValueOnce([{ year: 2025, weekNumber: 1 }]);
    const result = await counterRepo.listWeeksPageDataForMall(sessionA, 'mall-A');
    expect(assertOwnership).toHaveBeenCalledTimes(1);
    expect(result.uploads).toEqual([{ id: 'u1' }]);
    expect(result.legacyWeeks).toEqual([{ year: 2025, weekNumber: 1 }]);
  });
});

// ─── deleteUploadByIdForMall ─────────────────────────────────────────

describe('counterRepo.deleteUploadByIdForMall', () => {
  it('propagates mallRepo.assertOwnership failure before touching anything', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      counterRepo.deleteUploadByIdForMall(sessionA, 'mall-X', 'up-1'),
    ).rejects.toMatchObject({ status: 403 });
    expect(uploadFindUnique).not.toHaveBeenCalled();
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it('throws 404 when the upload does not exist', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    uploadFindUnique.mockResolvedValueOnce(null);
    await expect(
      counterRepo.deleteUploadByIdForMall(sessionA, 'mall-A', 'ghost'),
    ).rejects.toMatchObject({ status: 404 });
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it("throws 403 when the upload's mallId differs from the passed mallId (CSRF-shape)", async () => {
    // Caller owns both mall-A and mall-B, but passes mall-A + uploadId of a mall-B upload.
    assertOwnership.mockResolvedValueOnce(undefined);
    uploadFindUnique.mockResolvedValueOnce({ mallId: 'mall-B' });
    await expect(
      counterRepo.deleteUploadByIdForMall(sessionA, 'mall-A', 'up-cross'),
    ).rejects.toMatchObject({ status: 403 });
    expect(readingDeleteMany).not.toHaveBeenCalled();
    expect(uploadDelete).not.toHaveBeenCalled();
  });

  it('deletes readings then the upload when all checks pass and returns the reading count', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    uploadFindUnique.mockResolvedValueOnce({ mallId: 'mall-A' });
    readingDeleteMany.mockResolvedValueOnce({ count: 42 });
    uploadDelete.mockResolvedValueOnce({ id: 'up-A' });
    await expect(
      counterRepo.deleteUploadByIdForMall(sessionA, 'mall-A', 'up-A'),
    ).resolves.toEqual({ deletedReadings: 42 });
    expect(readingDeleteMany).toHaveBeenCalledWith({ where: { uploadId: 'up-A' } });
    expect(uploadDelete).toHaveBeenCalledWith({ where: { id: 'up-A' } });
  });
});

// ─── deleteLegacyWeekForMall ─────────────────────────────────────────

describe('counterRepo.deleteLegacyWeekForMall', () => {
  it('propagates mallRepo.assertOwnership failure before deleting anything', async () => {
    assertOwnership.mockRejectedValueOnce(new HttpError(403, 'Forbidden'));
    await expect(
      counterRepo.deleteLegacyWeekForMall(sessionA, 'mall-X', 10, 2025),
    ).rejects.toMatchObject({ status: 403 });
    expect(readingDeleteMany).not.toHaveBeenCalled();
  });

  it('only deletes legacy (uploadId:null) rows scoped to mallId + week + year', async () => {
    assertOwnership.mockResolvedValueOnce(undefined);
    readingDeleteMany.mockResolvedValueOnce({ count: 7 });
    await expect(
      counterRepo.deleteLegacyWeekForMall(sessionA, 'mall-A', 10, 2025),
    ).resolves.toEqual({ deletedReadings: 7 });
    expect(readingDeleteMany).toHaveBeenCalledWith({
      where: { mallId: 'mall-A', weekNumber: 10, year: 2025, uploadId: null },
    });
  });
});
