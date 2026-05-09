import type { LearningPort } from '@stelthion/intelligence-runtime';
import { prisma } from '../../db/prisma.js';
import { PrismaLearningPort, type LearningClient } from './prisma-learning-port.js';

let cached: PrismaLearningPort | null = null;

export function getLearningPort(): LearningPort {
  return getPrismaLearningPort();
}

export function getPrismaLearningPort(): PrismaLearningPort {
  if (!cached) {
    cached = new PrismaLearningPort(prisma() as unknown as LearningClient);
  }
  return cached;
}

export function resetLearningPortForTests(): void {
  cached = null;
}
