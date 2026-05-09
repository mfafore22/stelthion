import { describe, expect, it, beforeEach } from 'vitest';
import {
  cacheMetricsSnapshot,
  recordCacheAccess,
  resetCacheMetricsForTests,
} from '../engine/observability/cache-metrics.js';

describe('cache metrics', () => {
  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    await resetCacheMetricsForTests();
  });

  it('records local hit rate in test mode', async () => {
    await recordCacheAccess('hit');
    await recordCacheAccess('miss');
    await recordCacheAccess('hit');

    expect(await cacheMetricsSnapshot()).toEqual({
      source: 'memory',
      hits: 2,
      misses: 1,
      hitRate: 2 / 3,
    });
  });
});
