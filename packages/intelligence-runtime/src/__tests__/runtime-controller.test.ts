import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRuntimePort } from '../runtime-port.js';
import { RuntimeController, RuntimeScopeError } from '../runtime-controller.js';
import type { RuntimeActor } from '../runtime.js';

const actor: RuntimeActor = {
  id: 'operator-1',
  role: 'operator',
  customerScopes: ['customer-a'],
  marketScopes: ['helsinki-fi'],
};

test('RuntimeController starts idempotent actor-scoped runs', async () => {
  const controller = new RuntimeController(new InMemoryRuntimePort());
  const first = await controller.startRun({
    runId: 'run-1',
    domain: 'shoppermind',
    scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
    actor,
    correlationId: 'corr-1',
    startedAt: '2026-05-07T12:00:00Z',
    idempotencyKey: 'daily:helsinki-fi',
  });
  const second = await controller.startRun({
    runId: 'run-1',
    domain: 'shoppermind',
    scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
    actor,
    correlationId: 'corr-2',
  });

  assert.equal(first.run.id, second.run.id);
  assert.equal(second.context.correlationId, 'corr-1');
  assert.equal(first.run.idempotencyKey, 'daily:helsinki-fi');
});

test('RuntimeController records stages, decisions and artifacts', async () => {
  const controller = new RuntimeController(new InMemoryRuntimePort());
  await controller.startRun({
    runId: 'run-2',
    domain: 'shoppermind',
    scope: { customerId: 'customer-a' },
    actor,
    correlationId: 'corr-2',
  });

  await controller.recordStage('run-2', { name: 'collect', status: 'succeeded', outputCount: 4 });
  await controller.recordDecision('run-2', {
    id: 'decision-1',
    stage: 'validate',
    decision: 'publish',
    reasons: ['quality_clear'],
    createdAt: '2026-05-07T12:00:00Z',
  });
  const run = await controller.recordArtifact('run-2', {
    id: 'artifact-1',
    runId: 'run-2',
    type: 'memory_document',
    createdAt: '2026-05-07T12:00:00Z',
  });

  assert.equal(run.stages.length, 1);
  assert.equal(run.decisions[0]?.decision, 'publish');
  assert.deepEqual(run.artifactIds, ['artifact-1']);
});

test('RuntimeController denies inaccessible scopes', async () => {
  const controller = new RuntimeController(new InMemoryRuntimePort());
  await assert.rejects(
    () => controller.startRun({
      runId: 'run-3',
      domain: 'shoppermind',
      scope: { customerId: 'customer-b' },
      actor,
      correlationId: 'corr-3',
    }),
    RuntimeScopeError,
  );
});
