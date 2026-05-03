CREATE TABLE "LlmTrainingPair" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "mallId" TEXT NOT NULL,
  "conversationId" TEXT,
  "source" TEXT NOT NULL,
  "language" TEXT,
  "agentRole" TEXT,
  "prompt" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "viewContext" JSONB,
  "toolCalls" JSONB,
  "attachments" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LlmTrainingPair_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LlmTrainingPair_customerId_createdAt_idx"
  ON "LlmTrainingPair"("customerId", "createdAt");

CREATE INDEX "LlmTrainingPair_customerId_mallId_idx"
  ON "LlmTrainingPair"("customerId", "mallId");
