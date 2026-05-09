import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMF_INDICATORS,
  ImfMacroContextAdapter,
  parseImfPayload,
} from '../imf-macro-context.js';
import { MissingMacroIndicatorError } from '../macro-context-port.js';

const worldGdp = IMF_INDICATORS.find((indicator) => indicator.code === 'imf-world-gdp-growth');
if (!worldGdp) throw new Error('expected imf-world-gdp-growth indicator');

test('parseImfPayload extracts year/value pairs in chronological order', () => {
  const payload = {
    values: {
      [worldGdp.series]: {
        [worldGdp.area]: { '2023': 3.5, '2022': 3.6, '2024': 3.2, 'NA': 'skip' },
      },
    },
  };
  const points = parseImfPayload(worldGdp, payload);
  assert.deepEqual(points.map((p) => p.period), ['2022', '2023', '2024']);
  assert.equal(points[0]?.value, 3.6);
  assert.equal(points[0]?.periodDate, '2022-01-01T00:00:00.000Z');
});

test('parseImfPayload returns empty array when payload is malformed', () => {
  assert.deepEqual(parseImfPayload(worldGdp, null), []);
  assert.deepEqual(parseImfPayload(worldGdp, { values: {} }), []);
  assert.deepEqual(parseImfPayload(worldGdp, { values: { OTHER: {} } }), []);
});

test('ImfMacroContextAdapter routes through the injected fetcher and freezes time', async () => {
  let calledUrl = '';
  const adapter = new ImfMacroContextAdapter(
    async (url) => {
      calledUrl = url;
      return { values: { [worldGdp.series]: { [worldGdp.area]: { '2025': 3.1 } } } };
    },
    () => new Date('2026-05-08T00:00:00Z'),
  );

  const series = await adapter.fetchSeries('imf-world-gdp-growth');
  assert.equal(calledUrl, `https://www.imf.org/external/datamapper/api/v1/${worldGdp.series}/${worldGdp.area}`);
  assert.equal(series.points.length, 1);
  assert.equal(series.points[0]?.value, 3.1);
  assert.equal(series.fetchedAt, '2026-05-08T00:00:00.000Z');
});

test('ImfMacroContextAdapter throws MissingMacroIndicatorError on unknown code', async () => {
  const adapter = new ImfMacroContextAdapter(async () => ({}));
  await assert.rejects(
    () => adapter.fetchSeries('imf-not-defined'),
    MissingMacroIndicatorError,
  );
});

test('IMF_INDICATORS expose the canonical world+groups baseline', () => {
  const codes = IMF_INDICATORS.map((indicator) => indicator.code).sort();
  assert.deepEqual(codes, [
    'imf-advanced-inflation',
    'imf-emerging-gdp-growth',
    'imf-world-debt-gdp',
    'imf-world-gdp-growth',
    'imf-world-inflation',
  ]);
  for (const indicator of IMF_INDICATORS) {
    assert.equal(indicator.publisher, 'IMF');
    assert.equal(indicator.cadence, 'annual');
  }
});
