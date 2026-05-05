CREATE TABLE "ShopperMindActivityEvent" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "mallId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "marketId" TEXT,
  "eventName" TEXT NOT NULL,
  "tab" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "entityLabel" TEXT,
  "categoryIds" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopperMindActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShopperMindActivityEvent_customerId_createdAt_idx"
  ON "ShopperMindActivityEvent"("customerId", "createdAt");

CREATE INDEX "ShopperMindActivityEvent_customerId_mallId_idx"
  ON "ShopperMindActivityEvent"("customerId", "mallId");

CREATE INDEX "ShopperMindActivityEvent_customerId_eventName_idx"
  ON "ShopperMindActivityEvent"("customerId", "eventName");

CREATE INDEX "ShopperMindActivityEvent_customerId_entityType_idx"
  ON "ShopperMindActivityEvent"("customerId", "entityType");
