import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadVenueMindConfig, type VenueMindConfig } from '../config.js';
import { listVenueMindDemos } from '../engine.js';
import { venueMindGovernanceReport } from '../governance.js';
import { getVenueMindOverview, invalidateVenueMindOverview } from '../materialized.js';
import { principal, isAuthorized } from './auth.js';
import { recordRoute, venueMindMetricsSnapshot } from '../observability.js';
import { sendJson } from './responses.js';

type RouteResult = { status: number; body: unknown };

export function createVenueMindHandler(
  config: VenueMindConfig = loadVenueMindConfig(),
) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const started = Date.now();
    const url = new URL(req.url ?? '/', 'http://venuemind.local');
    const path = url.pathname;
    try {
      const result = await handleVenueMindRoute(req, url, config);
      sendJson(res, result.status, result.body);
      recordRoute(path, result.status, Date.now() - started);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal_error';
      sendJson(res, 500, { error: 'internal_error', message });
      recordRoute(path, 500, Date.now() - started);
    }
  };
}

export async function handleVenueMindRoute(
  req: IncomingMessage,
  url: URL,
  config: VenueMindConfig,
): Promise<RouteResult> {
  if (!isAuthorized(req, config)) return { status: 401, body: { error: 'unauthorized' } };
  if (req.method === 'GET' && url.pathname === '/internal/health') {
    return { status: 200, body: { status: 'ok', service: 'venuemind' } };
  }
  if (req.method === 'GET' && url.pathname === '/internal/metrics') {
    return { status: 200, body: venueMindMetricsSnapshot() };
  }
  if (req.method === 'GET' && url.pathname === '/internal/governance') {
    const report = venueMindGovernanceReport();
    return { status: report.status === 'ok' ? 200 : 503, body: report };
  }
  if (req.method === 'GET' && url.pathname === '/v1/venues') {
    return { status: 200, body: { venues: listVenueMindDemos() } };
  }
  if (req.method === 'GET' && url.pathname === '/v1/overview') {
    return { status: 200, body: getVenueMindOverview(url.searchParams.get('venueId')) };
  }
  if (req.method === 'POST' && url.pathname === '/internal/cache/invalidate') {
    const venueId = url.searchParams.get('venueId');
    return { status: 200, body: { invalidated: invalidateVenueMindOverview(venueId) } };
  }
  if (url.pathname === '/internal/principal') {
    return { status: 200, body: { principal: principal(req) } };
  }
  return { status: 404, body: { error: 'not_found' } };
}
