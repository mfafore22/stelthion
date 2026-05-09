export interface LearningRetentionPolicy {
  piiTtlDays: number;
  eventTtlDays: number;
  keepNotes: boolean;
  keepLabels: boolean;
  keepMetadata: boolean;
}

export interface LearningRetentionDates {
  piiExpiresAt: string;
  retentionExpiresAt: string;
}

export const DEFAULT_LEARNING_RETENTION_POLICY: LearningRetentionPolicy = {
  piiTtlDays: 90,
  eventTtlDays: 730,
  keepNotes: true,
  keepLabels: true,
  keepMetadata: true,
};

export function learningRetentionDates(
  observedAt: string,
  policy: LearningRetentionPolicy = DEFAULT_LEARNING_RETENTION_POLICY,
): LearningRetentionDates {
  const base = new Date(observedAt);
  if (Number.isNaN(base.getTime())) {
    throw new Error(`Invalid learning event observedAt: ${observedAt}`);
  }
  const retentionExpiresAt = addDays(base, policy.eventTtlDays).toISOString();
  const piiExpiry = addDays(base, Math.min(policy.piiTtlDays, policy.eventTtlDays));
  return { piiExpiresAt: piiExpiry.toISOString(), retentionExpiresAt };
}

export function shouldRetainLearningNotes(policy: LearningRetentionPolicy): boolean {
  return policy.keepNotes && policy.piiTtlDays > 0;
}

export function shouldRetainLearningLabels(policy: LearningRetentionPolicy): boolean {
  return policy.keepLabels && policy.eventTtlDays > 0;
}

export function shouldRetainLearningMetadata(policy: LearningRetentionPolicy): boolean {
  return policy.keepMetadata && policy.eventTtlDays > 0;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + Math.max(0, days) * 86_400_000);
}
