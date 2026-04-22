import { defineHandler } from '@/server/api/define-handler';

export const GET = defineHandler(
  { auth: 'session' },
  async ({ req }) => {
    const tenantId = new URL(req.url).searchParams.get('tenantId');
    return { conversations: [], tenantId: tenantId || 'default' };
  },
);
