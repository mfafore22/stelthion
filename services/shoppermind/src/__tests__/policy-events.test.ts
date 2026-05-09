import { describe, expect, it } from 'vitest';
import { interactionToPolicyTrainingEvent } from '../engine/learning/policy-events.js';
import type { InteractionRecord } from '../engine/insights/feedback-collector.js';

describe('interactionToPolicyTrainingEvent', () => {
  it('maps user feedback to a platform policy training event', () => {
    const event = interactionToPolicyTrainingEvent({
      id: 'feedback-1',
      phenomenonId: 'phenomenon-1',
      marketId: 'helsinki-fi',
      userId: 'user-1',
      interactionKind: 'thumbs',
      verdict: 'not_relevant',
      note: 'too noisy',
      createdAt: '2026-05-08T10:00:00Z',
    } satisfies InteractionRecord);

    expect(event.id).toBe('shoppermind:feedback:feedback-1');
    expect(event.source).toBe('user_feedback');
    expect(event.outcome).toBe('rejected');
    expect(event.scope.marketId).toBe('helsinki-fi');
    expect(event.labels).toEqual({ userVerdict: 'not_relevant' });
  });
});
