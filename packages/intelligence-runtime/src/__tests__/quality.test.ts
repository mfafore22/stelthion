import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQualityEnvelope,
  classifyFreshness,
  DEFAULT_QUALITY_POLICY,
  type QualityPolicy,
} from '../quality.js';

const now = new Date('2026-05-07T12:00:00Z');

test('classifyFreshness follows the default policy windows', () => {
  assert.equal(classifyFreshness(hoursAgo(2), now), 'fresh');
  assert.equal(classifyFreshness(hoursAgo(48), now), 'recent');
  assert.equal(classifyFreshness(hoursAgo(300), now), 'stale');
  assert.equal(classifyFreshness(hoursAgo(900), now), 'expired');
});

test('classifyFreshness accepts domain policy overrides', () => {
  const policy: QualityPolicy = {
    ...DEFAULT_QUALITY_POLICY,
    freshHours: 2,
    recentHours: 4,
    staleHours: 8,
  };
  assert.equal(classifyFreshness(hoursAgo(3), now, policy), 'recent');
  assert.equal(classifyFreshness(hoursAgo(9), now, policy), 'expired');
});

test('buildQualityEnvelope holds expired or contradictory results', () => {
  const expired = buildQualityEnvelope({
    confidence: 0.95,
    sourceStrength: 0.95,
    lastObservedAt: hoursAgo(900),
    now,
  });
  assert.equal(expired.handling, 'hold');
  assert.ok(expired.reasons.includes('freshness=expired'));

  const contradicted = buildQualityEnvelope({
    confidence: 0.95,
    sourceStrength: 0.95,
    contradictionRisk: 0.8,
    lastObservedAt: hoursAgo(1),
    now,
  });
  assert.equal(contradicted.handling, 'hold');
});

test('buildQualityEnvelope sends weak or sensitive results to review', () => {
  const weak = buildQualityEnvelope({
    confidence: 0.4,
    sourceStrength: 0.4,
    sourceCount: 2,
    lastObservedAt: hoursAgo(1),
    now,
  });
  assert.equal(weak.handling, 'review_first');

  const sensitive = buildQualityEnvelope({
    confidence: 0.95,
    sourceStrength: 0.95,
    sourceCount: 2,
    sensitivity: 'high',
    lastObservedAt: hoursAgo(1),
    now,
  });
  assert.equal(sensitive.handling, 'review_first');
});

test('buildQualityEnvelope promotes feedback divergence and lifecycle signals', () => {
  const quality = buildQualityEnvelope({
    confidence: 0.9,
    sourceStrength: 0.9,
    sourceCount: 3,
    divergenceRisk: 0.7,
    feedbackScore: -0.5,
    lifecycleRisk: 0.7,
    lastObservedAt: hoursAgo(1),
    now,
  });

  assert.equal(quality.decision, 'review');
  assert.equal(quality.uiVisibility, 'contextual');
  assert.equal(quality.chatCaution, 'cautious');
  assert.ok(quality.reasons.includes('divergence_risk'));
  assert.ok(quality.reasons.includes('negative_feedback'));
  assert.ok(quality.reasons.includes('lifecycle_risk'));
});

function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 3_600_000);
}
