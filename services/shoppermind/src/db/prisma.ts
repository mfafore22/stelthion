import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

let cached: PrismaClient | null = null;

export function prisma(): PrismaClient {
  if (cached) return cached;
  cached = new PrismaClient({
    datasources: { db: { url: env().DATABASE_URL } },
    log: env().NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
  return cached;
}

export async function disconnectPrisma(): Promise<void> {
  if (cached) {
    await cached.$disconnect();
    cached = null;
  }
}
