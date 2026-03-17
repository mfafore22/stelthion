-- AlterTable
ALTER TABLE "FloorplanStore" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FloorplanZone" ADD COLUMN     "baseVisitors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3);
