import { describe, expect, it } from 'vitest';
import { coordinatorRunToRuntimeRun } from '../engine/runtime/coordinator-runtime.js';

describe('coordinatorRunToRuntimeRun', () => {
  it('maps ShopperMind coordinator rows into shared runtime runs', () => {
    const run = coordinatorRunToRuntimeRun({
      id: 'coord-1',
      status: 'partial',
      marketIds: ['helsinki-fi'],
      stages: ['ingest', 'cluster', 'score', 'publish'],
      startedAt: new Date('2026-05-07T10:00:00Z'),
      finishedAt: new Date('2026-05-07T10:03:00Z'),
    });

    expect(run.domain).toBe('shoppermind');
    expect(run.status).toBe('partial');
    expect(run.scope.marketId).toBe('helsinki-fi');
    expect(run.stages.map((stage) => stage.name)).toEqual([
      'collect',
      'enrich',
      'score',
      'publish',
    ]);
  });
});
