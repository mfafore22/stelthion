export type ReleaseGateStatus = 'pass' | 'warn' | 'fail';
export type ReleaseGateSeverity = 'warning' | 'blocker';

export interface ReleaseGateFinding {
  severity: ReleaseGateSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ReleaseGateCheck {
  id: string;
  label: string;
  status: ReleaseGateStatus;
  findings: ReleaseGateFinding[];
  durationMs?: number;
}

export interface ReleaseGateReport {
  status: 'ok' | 'blocked';
  generatedAt: string;
  checks: ReleaseGateCheck[];
  blockerCount: number;
  warningCount: number;
}

export function passGate(
  id: string,
  label: string,
  durationMs?: number,
): ReleaseGateCheck {
  return { id, label, status: 'pass', findings: [], durationMs };
}

export function warnGate(
  id: string,
  label: string,
  finding: Omit<ReleaseGateFinding, 'severity'>,
  durationMs?: number,
): ReleaseGateCheck {
  return {
    id,
    label,
    status: 'warn',
    findings: [{ ...finding, severity: 'warning' }],
    durationMs,
  };
}

export function failGate(
  id: string,
  label: string,
  finding: Omit<ReleaseGateFinding, 'severity'>,
  durationMs?: number,
): ReleaseGateCheck {
  return {
    id,
    label,
    status: 'fail',
    findings: [{ ...finding, severity: 'blocker' }],
    durationMs,
  };
}

export function buildReleaseGateReport(
  checks: ReleaseGateCheck[],
  now: Date = new Date(),
): ReleaseGateReport {
  const findings = checks.flatMap((check) => check.findings);
  const blockerCount = findings.filter((item) => item.severity === 'blocker').length;
  const warningCount = findings.filter((item) => item.severity === 'warning').length;
  return {
    status: blockerCount > 0 ? 'blocked' : 'ok',
    generatedAt: now.toISOString(),
    checks: checks.map(copyCheck),
    blockerCount,
    warningCount,
  };
}

export function assertReleaseGateReport(report: ReleaseGateReport): void {
  if (report.status === 'blocked') {
    throw new Error(`Release gate blocked by ${report.blockerCount} finding(s)`);
  }
}

function copyCheck(check: ReleaseGateCheck): ReleaseGateCheck {
  return {
    ...check,
    findings: check.findings.map((finding) => ({
      ...finding,
      details: finding.details ? { ...finding.details } : undefined,
    })),
  };
}
