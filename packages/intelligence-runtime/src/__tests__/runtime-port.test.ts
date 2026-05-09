import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRuntimePort } from '../runtime-port.js';
import type { RuntimeRun } from '../runtime.js';

test('InMemoryRuntimePort drives a run through stages and decisions', async () => {
  const port = new InMemoryRuntimePort();
  await port.create(sampleRun('run-1', 'customer-a'));

  await port.appendStage('run-1', { name: 'collect', status: 'succeeded', outputCount: 3 });
  await port.appendDecision('run-1', {
    id: 'decision-1',
    stage: 'publish',
    decision: 'review',
    reasons: ['weak_source_strength'],
    createdAt: '2026-05-07T12:00:00Z',
  });
  await port.appendArtifact('run-1', 'artifact-1');
  const updated = await port.updateStatus('run-1', 'partial');

  assert.equal(updated?.status, 'partial');
  assert.equal(updated?.stages.length, 1);
  assert.equal(updated?.decisions[0]?.decision, 'review');
  assert.deepEqual(updated?.artifactIds, ['artifact-1']);
});

test('InMemoryRuntimePort lists runs by filter', async () => {
  const port = new InMemoryRuntimePort();
  await port.create(sampleRun('run-1', 'customer-a'));
  await port.create(sampleRun('run-2', 'customer-b'));
  await port.updateStatus('run-2', 'failed');

  const customerRuns = await port.list({ customerId: 'customer-a' });
  assert.deepEqual(customerRuns.map((run) => run.id), ['run-1']);

  const failed = await port.list({ status: 'failed' });
  assert.deepEqual(failed.map((run) => run.id), ['run-2']);
});

test('InMemoryRuntimePort returns null for missing runs', async () => {
  const port = new InMemoryRuntimePort();
  assert.equal(await port.get('missing'), null);
  assert.equal(await port.appendArtifact('missing', 'artifact'), null);
});

function sampleRun(id: string, customerId: string): RuntimeRun {
  return {
    id,
    domain: 'shoppermind',
    scope: { customerId },
    status: 'queued',
    stages: [],
    decisions: [],
    artifactIds: [],
    createdAt: '2026-05-07T12:00:00Z',
    updatedAt: '2026-05-07T12:00:00Z',
  };
}
