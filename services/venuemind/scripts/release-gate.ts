import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertReleaseGateReport,
  buildReleaseGateReport,
  failGate,
  passGate,
  type ReleaseGateCheck,
} from '@stelthion/intelligence-runtime';
import { venueMindGovernanceReport } from '../src/governance.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const checks: ReleaseGateCheck[] = [];

checks.push(commandGate('runtime-build', ['npm', 'run', 'build', '--workspace=@stelthion/intelligence-runtime']));
checks.push(commandGate('service-lint', ['npm', 'run', 'lint', '--workspace=@stelthion/venuemind']));
checks.push(commandGate('service-build', ['npm', 'run', 'build', '--workspace=@stelthion/venuemind']));
checks.push(commandGate('service-test', ['npm', 'test', '--workspace=@stelthion/venuemind']));
checks.push(governanceGate());

const report = buildReleaseGateReport(checks);
console.log(JSON.stringify(report, null, 2));
try {
  assertReleaseGateReport(report);
} catch {
  process.exitCode = 1;
}

function commandGate(id: string, command: string[]): ReleaseGateCheck {
  const started = Date.now();
  const result = spawnSync(command[0]!, command.slice(1), {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const durationMs = Date.now() - started;
  if (result.status === 0) return passGate(id, id, durationMs);
  return failGate(id, id, {
    code: 'command_failed',
    message: `${command.join(' ')} failed. Re-run locally for full output.`,
    details: { output: tail(`${result.stdout ?? ''}${result.stderr ?? ''}`) },
  }, durationMs);
}

function governanceGate(): ReleaseGateCheck {
  const report = venueMindGovernanceReport();
  if (report.blockerCount === 0) return passGate('governance', 'governance');
  return failGate('governance', 'governance', {
    code: 'governance_findings',
    message: 'VenueMind governance reported blockers.',
    details: { findings: report.findings },
  });
}

function tail(value: string): string {
  return value.slice(-4000);
}
