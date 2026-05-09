import { describe, expect, it } from 'vitest';
import {
  PrismaLearningPort,
  type LearningClient,
} from '../engine/learning/prisma-learning-port.js';
import type { JsonRecord } from '../engine/learning/prisma-learning-codec.js';

describe('PrismaLearningPort', () => {
  it('round-trips a policy training event with pseudonymized PII', async () => {
    const client = fakeLearningClient();
    const port = new PrismaLearningPort(client, {
      piiTtlDays: 1,
      eventTtlDays: 2,
      keepNotes: true,
      keepLabels: true,
      keepMetadata: true,
    });

    const saved = await port.appendTrainingEvent({
      id: 'event-1',
      domain: 'shoppermind',
      scope: { marketId: 'helsinki-fi' },
      source: 'user_feedback',
      resultId: 'phenomenon-1',
      outcome: 'rejected',
      observedAt: '2026-05-08T00:00:00Z',
      actorId: 'user@example.com',
      notes: 'contains reviewer context',
      metadata: { email: 'user@example.com', reason: 'noise' },
    });

    expect(saved.actorId).toMatch(/^sha256:/);
    expect(saved.metadata).toEqual({ reason: 'noise' });

    const listed = await port.listTrainingEvents({ marketId: 'helsinki-fi' });
    expect(listed[0]!.id).toBe('event-1');
    expect(listed[0]!.notes).toBe('contains reviewer context');

    const pruned = await port.pruneExpiredTrainingEvents(new Date('2026-05-09T01:00:00Z'));
    expect(pruned.anonymized).toBe(1);
    expect((await port.listTrainingEvents({}))[0]!.notes).toBeUndefined();
  });
});

function fakeLearningClient(): LearningClient {
  const events: JsonRecord[] = [];
  return {
    policyTrainingEvent: {
      async create({ data }) {
        const row = { ...data, createdAt: new Date(), updatedAt: new Date() };
        events.push(row);
        return row;
      },
      async findMany(args) {
        return events.filter((event) => eventMatches(event, args.where as JsonRecord));
      },
      async updateMany(args) {
        const now = (args.where as JsonRecord).piiExpiresAt as { lte: Date };
        let count = 0;
        for (const event of events) {
          if (event.piiExpiresAt instanceof Date && event.piiExpiresAt <= now.lte) {
            Object.assign(event, args.data, { anonymizedAt: now.lte });
            count++;
          }
        }
        return { count };
      },
      async deleteMany() {
        return { count: 0 };
      },
    },
    policyPackRecord: emptyPackDelegate(),
    policyEvaluationResultRecord: emptyEvaluationDelegate(),
  };
}

function eventMatches(event: JsonRecord, where: JsonRecord): boolean {
  if (where.domain && event.domain !== where.domain) return false;
  if (where.source && event.source !== where.source) return false;
  const scope = event.scope as { marketId?: string };
  const scoped = where.scope as { equals?: string } | undefined;
  return !scoped || scope.marketId === scoped.equals;
}

function emptyPackDelegate() {
  return {
    async upsert() { return {}; },
    async findUnique() { return null; },
    async findMany() { return []; },
  };
}

function emptyEvaluationDelegate() {
  return {
    async create({ data }: { data: JsonRecord }) { return data; },
    async findMany() { return []; },
  };
}
