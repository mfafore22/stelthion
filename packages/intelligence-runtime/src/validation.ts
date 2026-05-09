import type { RuntimeScope } from './runtime.js';

export type ValidationKind =
  | 'source_trust'
  | 'freshness'
  | 'contradiction'
  | 'source_count'
  | 'sensitive_claim';

export type ValidationSeverity = 'info' | 'warning' | 'blocker';

export interface ValidationRequirement {
  kind: ValidationKind;
  required: boolean;
  blockerOnFailure?: boolean;
}

export interface ValidationSubject {
  id: string;
  scope: RuntimeScope;
  title?: string;
  body?: string;
  sourceIds: string[];
  observedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ValidationFinding {
  kind: ValidationKind;
  severity: ValidationSeverity;
  score: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationPort {
  kind: ValidationKind;
  validate(subject: ValidationSubject): Promise<ValidationFinding[]>;
}

export interface ValidationSummary {
  findings: ValidationFinding[];
  blockerCount: number;
  warningCount: number;
}

export async function runValidationPorts(
  subject: ValidationSubject,
  ports: ValidationPort[],
): Promise<ValidationSummary> {
  const nested = await Promise.all(ports.map((port) => port.validate(subject)));
  const findings = nested.flat();
  return {
    findings,
    blockerCount: findings.filter((f) => f.severity === 'blocker').length,
    warningCount: findings.filter((f) => f.severity === 'warning').length,
  };
}
