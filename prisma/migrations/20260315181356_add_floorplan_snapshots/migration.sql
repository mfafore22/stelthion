-- CreateTable
CREATE TABLE "FloorplanSnapshot" (
    "id" TEXT NOT NULL,
    "mallId" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloorplanSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorplanSnapshot_mallId_floor_createdAt_idx" ON "FloorplanSnapshot"("mallId", "floor", "createdAt");
