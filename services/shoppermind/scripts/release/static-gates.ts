import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  failGate,
  passGate,
  type ReleaseGateCheck,
} from '../../../../packages/intelligence-runtime/src/release-gates.js';

const destructive = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
];

export async function migrationStaticGate(repoRoot: string): Promise<ReleaseGateCheck> {
  const started = Date.now();
  const dir = join(repoRoot, 'services/shoppermind/prisma/migrations');
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  if (dirs.length === 0) {
    return failGate('migration-static', 'Migration static check', {
      code: 'no_migrations',
      message: 'No service migration directories found',
    });
  }

  for (const name of dirs) {
    const sql = await readFile(join(dir, name, 'migration.sql'), 'utf8').catch(() => null);
    if (!sql) return missingMigration(name);
    const destructiveSql = destructive.some((pattern) => pattern.test(sql));
    if (destructiveSql && !sql.includes('release-gate:allow-destructive')) {
      return failGate('migration-static', 'Migration static check', {
        code: 'destructive_migration',
        message: `Migration ${name} contains destructive SQL without approval marker`,
      }, Date.now() - started);
    }
  }
  return passGate('migration-static', 'Migration static check', Date.now() - started);
}

export async function governanceFreshnessGate(repoRoot: string): Promise<ReleaseGateCheck> {
  const doc = await readFile(join(repoRoot, 'docs/intelligence-runtime-phase-0-2.md'), 'utf8')
    .catch(() => '');
  const required = [
    'gate:phase-6.1b',
    'gate:phase-6.2',
    'gate:phase-6.3',
    'gate:phase-6.4',
    'gate:phase-6.5',
    'gate:phase-6.6',
  ];
  const missing = required.filter((text) => !doc.includes(text));
  if (missing.length > 0) {
    return failGate('governance-freshness', 'Governance freshness check', {
      code: 'phase_docs_stale',
      message: 'Phase governance docs are missing current release-gate sections',
      details: { missing },
    });
  }
  return passGate('governance-freshness', 'Governance freshness check');
}

function missingMigration(name: string): ReleaseGateCheck {
  return failGate('migration-static', 'Migration static check', {
    code: 'missing_migration_sql',
    message: `Migration ${name} is missing migration.sql`,
  });
}
