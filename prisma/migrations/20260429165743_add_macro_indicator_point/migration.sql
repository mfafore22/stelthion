-- CreateTable
CREATE TABLE "MacroIndicatorPoint" (
    "id" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "raw" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroIndicatorPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MacroIndicatorPoint_indicatorCode_periodDate_idx" ON "MacroIndicatorPoint"("indicatorCode", "periodDate");

-- CreateIndex
CREATE INDEX "MacroIndicatorPoint_country_idx" ON "MacroIndicatorPoint"("country");

-- CreateIndex
CREATE UNIQUE INDEX "MacroIndicatorPoint_indicatorCode_period_key" ON "MacroIndicatorPoint"("indicatorCode", "period");
