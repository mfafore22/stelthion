import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { commandGate } from './release/command-gate.js';
import { printAndExit } from './release/report.js';
import { endpointSmokeGate } from './release/smoke-gates.js';
import { governanceFreshnessGate, migrationStaticGate } from './release/static-gates.js';
import type { ReleaseGateCheck } from '../../../packages/intelligence-runtime/src/release-gates.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

const checks: ReleaseGateCheck[] = [];

checks.push(await commandGate('runtime-lint', 'Runtime lint', [
  'npm', 'run', 'lint', '--workspace=@stelthion/intelligence-runtime',
], repoRoot));

checks.push(await commandGate('runtime-test', 'Runtime tests', [
  'npm', 'test', '--workspace=@stelthion/intelligence-runtime',
], repoRoot));

checks.push(await commandGate('service-lint', 'ShopperMind lint', [
  'npm', 'run', 'lint', '--workspace=@stelthion/shoppermind',
], repoRoot));

checks.push(await commandGate('service-build', 'ShopperMind build', [
  'npm', 'run', 'build', '--workspace=@stelthion/shoppermind',
], repoRoot));

checks.push(await commandGate('prisma-validate', 'ShopperMind Prisma validate', [
  'npx', 'prisma', 'validate', '--schema', 'services/shoppermind/prisma/schema.prisma',
], repoRoot));

checks.push(await commandGate('seed-checks', 'Seed checks', [
  'npm', 'test', '--workspace=@stelthion/shoppermind', '--', 'seed-bootstrap',
], repoRoot));

checks.push(await commandGate('contract-checks', 'Phase 6 contract checks', [
  'npm',
  'test',
  '--workspace=@stelthion/shoppermind',
  '--',
  'phase-6-contracts',
  'agent-governance',
  'api-metrics',
  'cache-metrics',
  'llm-metrics',
  'prisma-learning-policy-pack',
  'signal-of-the-day-materializer',
], repoRoot));

checks.push(await migrationStaticGate(repoRoot));
checks.push(await governanceFreshnessGate(repoRoot));
checks.push(await endpointSmokeGate());

printAndExit(checks);
