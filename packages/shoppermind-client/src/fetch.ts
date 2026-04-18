import {
  ShopperMindApiError,
  ShopperMindAuthError,
  ShopperMindNetworkError,
  ShopperMindValidationError,
} from './errors.js';

export interface FetchOptions {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export async function request<T>(
  opts: FetchOptions,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  init?: { query?: Record<string, string | number | undefined>; body?: unknown },
): Promise<T> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 2;
  const backoffMs = opts.backoffMs ?? 250;
  const timeoutMs = opts.timeoutMs ?? 15_000;

  const url = new URL(path.replace(/^\//, ''), opts.baseUrl.endsWith('/') ? opts.baseUrl : opts.baseUrl + '/');
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/json',
  };
  let body: string | undefined;
  if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url.toString(), {
        method,
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      const parsed: unknown = text ? safeJson(text) : null;

      if (res.ok) return parsed as T;
      if (res.status === 401) throw new ShopperMindAuthError(parsed);
      if (res.status === 400 || res.status === 422) throw new ShopperMindValidationError(parsed);
      if (res.status >= 500 && attempt < retries) {
        lastErr = new ShopperMindApiError(res.status, `http_${res.status}`, parsed);
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
      throw new ShopperMindApiError(res.status, `http_${res.status}`, parsed);
    } catch (err) {
      clearTimeout(timer);
      if (
        err instanceof ShopperMindApiError ||
        err instanceof ShopperMindAuthError ||
        err instanceof ShopperMindValidationError
      ) {
        if (err instanceof ShopperMindApiError && err.status >= 500 && attempt < retries) {
          lastErr = err;
          await sleep(backoffMs * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }
      if (attempt < retries) {
        lastErr = err;
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
      throw new ShopperMindNetworkError(err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new ShopperMindNetworkError(lastErr);
}

/**
 * Issue an authenticated request and return the raw `Response` so callers
 * can stream NDJSON / large payloads without buffering. Retries on 5xx use
 * the same exponential-backoff shape as `request`; non-5xx errors are
 * wrapped as `ShopperMindApiError`.
 */
export async function requestStream(
  opts: FetchOptions,
  method: 'GET' | 'POST',
  path: string,
  init?: { query?: Record<string, string | number | undefined> },
): Promise<Response> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 2;
  const backoffMs = opts.backoffMs ?? 250;

  const url = new URL(path.replace(/^\//, ''), opts.baseUrl.endsWith('/') ? opts.baseUrl : opts.baseUrl + '/');
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/x-ndjson',
  };

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url.toString(), { method, headers });
      if (res.ok) return res;
      if (res.status === 401) throw new ShopperMindAuthError(null);
      if (res.status === 400 || res.status === 422) throw new ShopperMindValidationError(null);
      if (res.status >= 500 && attempt < retries) {
        lastErr = new ShopperMindApiError(res.status, `http_${res.status}`, null);
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
      throw new ShopperMindApiError(res.status, `http_${res.status}`, null);
    } catch (err) {
      if (
        err instanceof ShopperMindApiError ||
        err instanceof ShopperMindAuthError ||
        err instanceof ShopperMindValidationError
      ) {
        if (err instanceof ShopperMindApiError && err.status >= 500 && attempt < retries) {
          lastErr = err;
          await sleep(backoffMs * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }
      if (attempt < retries) {
        lastErr = err;
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
      throw new ShopperMindNetworkError(err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new ShopperMindNetworkError(lastErr);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
