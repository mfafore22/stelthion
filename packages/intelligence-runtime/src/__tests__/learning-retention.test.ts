import test from 'node:test';
import assert from 'node:assert/strict';
import {
  learningRetentionDates,
  shouldRetainLearningLabels,
  shouldRetainLearningMetadata,
  shouldRetainLearningNotes,
} from '../learning-retention.js';

test('learningRetentionDates caps PII retention at event retention', () => {
  const dates = learningRetentionDates('2026-05-08T00:00:00Z', {
    piiTtlDays: 90,
    eventTtlDays: 30,
    keepNotes: true,
    keepLabels: true,
    keepMetadata: true,
  });

  assert.equal(dates.piiExpiresAt, '2026-06-07T00:00:00.000Z');
  assert.equal(dates.retentionExpiresAt, '2026-06-07T00:00:00.000Z');
});

test('learning retention helpers honor disabled payload retention', () => {
  const policy = {
    piiTtlDays: 0,
    eventTtlDays: 365,
    keepNotes: true,
    keepLabels: false,
    keepMetadata: false,
  };

  assert.equal(shouldRetainLearningNotes(policy), false);
  assert.equal(shouldRetainLearningLabels(policy), false);
  assert.equal(shouldRetainLearningMetadata(policy), false);
});
