import { createServer } from 'node:http';
import { loadVenueMindConfig } from '../config.js';
import { createVenueMindHandler } from './handler.js';

export function startVenueMindServer(): ReturnType<typeof createServer> {
  const config = loadVenueMindConfig();
  const server = createServer(createVenueMindHandler(config));
  server.listen(config.port, () => {
    console.warn(`VenueMind service listening on ${config.port}`);
  });
  return server;
}
