import { describe, expect, it, vi } from 'vitest';
import { fetchImf } from '../engine/sources/imf.js';

const baseCtx = {
  id: 'src-imf',
  name: 'IMF DataMapper',
  type: 'IMF' as const,
  url: 'https://www.imf.org/external/datamapper/api/v1',
  country: 'GLOBAL',
  language: 'en',
};

describe('fetchImf', () => {
  it('returns signals for the latest IMF DataMapper points', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          values: { NGDP_RPCH: { WLD: { '2022': 3.5, '2023': 3.0, '2024': 3.2 } } },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchImf({
      ...baseCtx,
      config: { code: 'imf-world-gdp-growth' },
    });

    expect(result.errorMsg).toBeUndefined();
    expect(result.signals).toHaveLength(3);
    expect(result.signals[0]?.externalId).toBe('imf:imf-world-gdp-growth:2022');
    expect(result.signals[2]?.metadata?.value).toBe(3.2);
    expect(result.signals[0]?.country).toBe('GLOBAL');
    fetchMock.mockRestore();
  });

  it('errors when the source config does not pin an indicator', async () => {
    const result = await fetchImf({ ...baseCtx, config: {} });
    expect(result.signals).toHaveLength(0);
    expect(result.errorMsg).toMatch(/missing config\.code/);
  });
});
