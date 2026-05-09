-- Add IMF to the SignalSource type enum so the IMF DataMapper API can be
-- registered as a global macro source feeding trend formation.
ALTER TYPE "SourceType" ADD VALUE IF NOT EXISTS 'IMF';
