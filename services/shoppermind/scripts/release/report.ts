import {
  assertReleaseGateReport,
  buildReleaseGateReport,
  type ReleaseGateCheck,
} from '../../../../packages/intelligence-runtime/src/release-gates.js';

export function printAndExit(checks: ReleaseGateCheck[]): void {
  const report = buildReleaseGateReport(checks);
  const summary = report.checks.map((check) => ({
    id: check.id,
    status: check.status,
    findings: check.findings.map((finding) => finding.code),
    durationMs: check.durationMs,
  }));

  console.log(JSON.stringify({ ...report, checks: summary }, null, 2));
  try {
    assertReleaseGateReport(report);
  } catch {
    process.exitCode = 1;
  }
}
