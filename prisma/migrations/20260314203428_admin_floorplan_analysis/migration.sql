-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "FloorplanZone" (
    "id" TEXT NOT NULL,
    "mallId" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameFi" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "svgPoints" TEXT NOT NULL,
    "labelX" DOUBLE PRECISION NOT NULL,
    "labelY" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "areaSqm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorplanZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorplanStore" (
    "id" TEXT NOT NULL,
    "mallId" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "zoneDbId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "h" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorplanStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL,
    "mallId" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "angleDeg" DOUBLE PRECISION,
    "fovDeg" DOUBLE PRECISION,
    "rangeM" DOUBLE PRECISION,
    "streamUrl" TEXT,
    "zoneDbId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisJob" (
    "id" TEXT NOT NULL,
    "mallId" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "footageDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "journeyCount" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "density" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneySession" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "taggedCount" INTEGER NOT NULL,
    "recognizedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyPath" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "zoneSequence" TEXT NOT NULL,
    "timestamps" TEXT NOT NULL,

    CONSTRAINT "JourneyPath_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FloorplanZone_mallId_floor_zoneId_key" ON "FloorplanZone"("mallId", "floor", "zoneId");

-- AddForeignKey
ALTER TABLE "FloorplanStore" ADD CONSTRAINT "FloorplanStore_zoneDbId_fkey" FOREIGN KEY ("zoneDbId") REFERENCES "FloorplanZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_zoneDbId_fkey" FOREIGN KEY ("zoneDbId") REFERENCES "FloorplanZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AnalysisJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneySession" ADD CONSTRAINT "JourneySession_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AnalysisJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyPath" ADD CONSTRAINT "JourneyPath_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "JourneySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
