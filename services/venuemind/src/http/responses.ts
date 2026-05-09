import type { ServerResponse } from 'node:http';

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(json),
  });
  res.end(json);
}

export function sendNotFound(res: ServerResponse): void {
  sendJson(res, 404, { error: 'not_found' });
}

export function sendUnauthorized(res: ServerResponse): void {
  sendJson(res, 401, { error: 'unauthorized' });
}
