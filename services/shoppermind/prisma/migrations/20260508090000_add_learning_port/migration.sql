CREATE TABLE "PolicyTrainingEvent" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "scope" JSONB NOT NULL,
  "source" TEXT NOT NULL,
  "resultId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "actorIdHash" TEXT,
  "policyPackId" TEXT,
  "quality" JSONB,
  "features" JSONB,
  "labels" JSONB,
  "notes" TEXT,
  "metadata" JSONB,
  "piiExpiresAt" TIMESTAMP(3) NOT NULL,
  "retentionExpiresAt" TIMESTAMP(3) NOT NULL,
  "anonymizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PolicyTrainingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyPackRecord" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "maturityStage" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "marketId" TEXT,
  "qualityPolicy" JSONB,
  "validationProfileId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "activatedAt" TIMESTAMP(3),
  CONSTRAINT "PolicyPackRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PolicyEvaluationResultRecord" (
  "id" TEXT NOT NULL,
  "datasetId" TEXT NOT NULL,
  "currentPolicyPackId" TEXT NOT NULL,
  "candidatePolicyPackId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metrics" JSONB NOT NULL,
  "gates" JSONB NOT NULL,
  "regressionCaseIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "evaluatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyEvaluationResultRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PolicyTrainingEvent_domain_source_observedAt_idx"
  ON "PolicyTrainingEvent"("domain", "source", "observedAt");

CREATE INDEX "PolicyTrainingEvent_resultId_observedAt_idx"
  ON "PolicyTrainingEvent"("resultId", "observedAt");

CREATE INDEX "PolicyTrainingEvent_piiExpiresAt_idx"
  ON "PolicyTrainingEvent"("piiExpiresAt");

CREATE INDEX "PolicyTrainingEvent_retentionExpiresAt_idx"
  ON "PolicyTrainingEvent"("retentionExpiresAt");

CREATE INDEX "PolicyPackRecord_domain_status_idx"
  ON "PolicyPackRecord"("domain", "status");

CREATE INDEX "PolicyPackRecord_marketId_status_idx"
  ON "PolicyPackRecord"("marketId", "status");

CREATE INDEX "PolicyEvaluationResultRecord_candidatePolicyPackId_status_idx"
  ON "PolicyEvaluationResultRecord"("candidatePolicyPackId", "status");

CREATE INDEX "PolicyEvaluationResultRecord_datasetId_evaluatedAt_idx"
  ON "PolicyEvaluationResultRecord"("datasetId", "evaluatedAt");
