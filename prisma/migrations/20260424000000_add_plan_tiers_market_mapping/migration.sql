-- Add Plan model for customer tier management
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "priceMonthly" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- Add planId to Customer
ALTER TABLE "Customer" ADD COLUMN "planId" TEXT;

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Add MallMarketMapping for ShopperMind market resolution
CREATE TABLE "MallMarketMapping" (
    "mallId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,

    CONSTRAINT "MallMarketMapping_pkey" PRIMARY KEY ("mallId")
);

CREATE UNIQUE INDEX "MallMarketMapping_mallId_key" ON "MallMarketMapping"("mallId");

ALTER TABLE "MallMarketMapping" ADD CONSTRAINT "MallMarketMapping_mallId_fkey"
    FOREIGN KEY ("mallId") REFERENCES "Mall"("mallId")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default plans
INSERT INTO "Plan" ("id", "name", "features", "priceMonthly", "createdAt") VALUES
    ('plan_starter',   'Starter',    '{"shoppermind":false,"edgeVision":false,"concierge":false,"maxMalls":1}',  NULL,  NOW()),
    ('plan_pro',       'Pro',        '{"shoppermind":true,"edgeVision":false,"concierge":true,"maxMalls":3}',    490.0, NOW()),
    ('plan_enterprise','Enterprise', '{"shoppermind":true,"edgeVision":true,"concierge":true,"maxMalls":20}',   1490.0, NOW());
