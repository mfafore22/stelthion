import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';

type Scope = 'public' | 'internal';

function extractToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function requireBearer(scope: Scope) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const token = extractToken(req);
    const expected =
      scope === 'internal' ? env().SHOPPERMIND_INTERNAL_TOKEN : env().SHOPPERMIND_SERVICE_TOKEN;
    if (!token || token !== expected) {
      reply.code(401).send({ error: 'unauthorized' });
    }
  };
}

// Also accept the internal token on public routes (internal clients are privileged).
export function requireAnyBearer() {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const token = extractToken(req);
    if (
      !token ||
      (token !== env().SHOPPERMIND_SERVICE_TOKEN && token !== env().SHOPPERMIND_INTERNAL_TOKEN)
    ) {
      reply.code(401).send({ error: 'unauthorized' });
    }
  };
}

export const bearerPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('requireBearer', requireBearer);
  app.decorate('requireAnyBearer', requireAnyBearer);
};
