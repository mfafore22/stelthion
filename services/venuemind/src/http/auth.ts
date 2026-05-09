import type { IncomingMessage } from 'node:http';
import type { VenueMindConfig } from '../config.js';

export function isAuthorized(req: IncomingMessage, config: VenueMindConfig): boolean {
  if (!config.internalToken && config.nodeEnv !== 'production') return true;
  const header = req.headers.authorization;
  return header === `Bearer ${config.internalToken}`;
}

export function principal(req: IncomingMessage): string {
  return req.headers.authorization ? 'bearer' : req.socket.remoteAddress ?? 'unknown';
}
