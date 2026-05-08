import { PrismaClient } from '../../node_modules/.prisma/shoppermind-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';

let cached: PrismaClient | null = null;

export function prisma(): PrismaClient {
  if (cached) return cached;
  const adapter = new PrismaPg({ connectionString: env().DATABASE_URL });
  cached = new PrismaClient({
    adapter,
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
