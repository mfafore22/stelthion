// Re-export shim. Canonical location: src/server/db/client.ts
// This file is kept so existing imports (`@/app/lib/prisma`, `./app/lib/prisma`,
// etc.) continue to work during the Phase 3 migration. Do not add new imports
// from this path — import from `@/server/db/client` directly.
export { default } from '@/server/db/client';
