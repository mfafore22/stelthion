import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertReleaseGateReport,
  buildReleaseGateReport,
  failGate,
  passGate,
  warnGate,
} from '../release-gates.js';

test('buildReleaseGateReport blocks on blocker findings', () => {
  const report = buildReleaseGateReport([
    passGate('build', 'Build'),
    warnGate('smoke', 'Smoke', { code: 'missing_url', message: 'Smoke URL missing' }),
    failGate('governance', 'Governance', { code: 'blocked', message: 'Governance blocked' }),
  ], new Date('2026-05-08T10:00:00.000Z'));

  assert.equal(report.status, 'blocked');
  assert.equal(report.blockerCount, 1);
  assert.equal(report.warningCount, 1);
  assert.throws(() => assertReleaseGateReport(report), /Release gate blocked/);
});

test('buildReleaseGateReport passes when only warnings are present', () => {
  const report = buildReleaseGateReport([
    warnGate('smoke', 'Smoke', { code: 'missing_url', message: 'Smoke URL missing' }),
  ]);

  assert.equal(report.status, 'ok');
  assert.equal(report.blockerCount, 0);
  assert.doesNotThrow(() => assertReleaseGateReport(report));
});
