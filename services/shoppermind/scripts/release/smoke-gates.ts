import {
  failGate,
  passGate,
  warnGate,
  type ReleaseGateCheck,
} from '../../../../packages/intelligence-runtime/src/release-gates.js';

export async function endpointSmokeGate(): Promise<ReleaseGateCheck> {
  const baseUrl = process.env.SHOPPERMIND_SMOKE_BASE_URL;
  const token = process.env.SHOPPERMIND_INTERNAL_TOKEN;
  const required =
    process.env.SHOPPERMIND_REQUIRE_SMOKE === 'true' || process.env.NODE_ENV === 'production';
  if (!baseUrl || !token) {
    const gate = required ? failGate : warnGate;
    return gate('endpoint-smoke', 'Internal endpoint smoke check', {
      code: 'smoke_not_configured',
      message: 'Set SHOPPERMIND_SMOKE_BASE_URL and SHOPPERMIND_INTERNAL_TOKEN to run live smoke',
      details: { nodeEnv: process.env.NODE_ENV, requireSmoke: process.env.SHOPPERMIND_REQUIRE_SMOKE },
    });
  }

  const started = Date.now();
  const headers = { authorization: `Bearer ${token}` };
  const health = await getJson(`${baseUrl}/internal/health`, headers);
  if (!health.ok || health.body.status !== 'ok') return failed('health_failed', health, started);

  const governance = await getJson(`${baseUrl}/internal/governance`, headers);
  if (!governance.ok || governance.body.status !== 'ok') {
    return failed('governance_blocked', governance, started);
  }

  const metrics = await getJson(`${baseUrl}/internal/metrics`, headers);
  const hasMetrics = metrics.body.observedAt && metrics.body.api && metrics.body.cache;
  if (!metrics.ok || !hasMetrics) return failed('metrics_invalid', metrics, started);
  return passGate('endpoint-smoke', 'Internal endpoint smoke check', Date.now() - started);
}

async function getJson(
  url: string,
  headers: Record<string, string>,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { headers });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: { error: String(err) } };
  }
}

function failed(
  code: string,
  result: { status: number; body: Record<string, unknown> },
  started: number,
): ReleaseGateCheck {
  return failGate('endpoint-smoke', 'Internal endpoint smoke check', {
    code,
    message: 'Internal endpoint smoke check failed',
    details: { status: result.status, body: result.body },
  }, Date.now() - started);
}
