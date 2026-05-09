import { startVenueMindServer } from './http/server.js';

export * from './agents.js';
export * from './adapter.js';
export * from './config.js';
export * from './types.js';
export * from './demoData.js';
export * from './engine.js';
export * from './governance.js';
export * from './http/handler.js';
export * from './http/server.js';
export * from './materialized.js';
export * from './observability.js';
export * from './quality.js';

if (process.argv[1]?.endsWith('/dist/index.js') || process.argv[1]?.endsWith('/src/index.ts')) {
  startVenueMindServer();
}
