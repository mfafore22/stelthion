import test from 'node:test';
import assert from 'node:assert/strict';
import { runValidationPorts, type ValidationPort } from '../validation.js';

test('runValidationPorts summarizes warnings and blockers', async () => {
  const ports: ValidationPort[] = [
    {
      kind: 'source_count',
      async validate() {
        return [{ kind: 'source_count', severity: 'warning', score: 0.4, reason: 'one_source' }];
      },
    },
    {
      kind: 'sensitive_claim',
      async validate() {
        return [{ kind: 'sensitive_claim', severity: 'blocker', score: 0.9, reason: 'private_data' }];
      },
    },
  ];

  const summary = await runValidationPorts({
    id: 'result-1',
    scope: { marketId: 'helsinki-fi' },
    sourceIds: ['source-1'],
  }, ports);

  assert.equal(summary.warningCount, 1);
  assert.equal(summary.blockerCount, 1);
  assert.equal(summary.findings.length, 2);
});
