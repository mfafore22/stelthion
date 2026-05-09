import type { AgentDefinition, RuntimeToolDefinition } from './agent-types.js';

export type GovernanceSeverity = 'warning' | 'blocker';

export interface GovernanceFinding {
  severity: GovernanceSeverity;
  subjectId: string;
  code: string;
  message: string;
}

export interface GovernanceReport {
  findings: GovernanceFinding[];
  blockerCount: number;
  warningCount: number;
}

export function validateAgentGovernance(
  agents: AgentDefinition[],
  tools: RuntimeToolDefinition[],
): GovernanceReport {
  const toolIds = new Set(tools.map((tool) => tool.id));
  const findings = agents.flatMap((agent) => agentFindings(agent, toolIds));
  return {
    findings,
    blockerCount: findings.filter((item) => item.severity === 'blocker').length,
    warningCount: findings.filter((item) => item.severity === 'warning').length,
  };
}

function agentFindings(
  agent: AgentDefinition,
  toolIds: Set<string>,
): GovernanceFinding[] {
  const findings: GovernanceFinding[] = [];
  if (agent.scopeConstraints.length === 0) {
    findings.push(finding(agent.id, 'blocker', 'missing_scope_constraints'));
  }
  if (agent.validation.length === 0) {
    findings.push(finding(agent.id, 'warning', 'missing_validation_requirements'));
  }
  for (const capability of agent.capabilities) {
    for (const toolId of capability.requiredToolIds) {
      if (!agent.allowedToolIds.includes(toolId)) {
        findings.push(finding(agent.id, 'blocker', 'required_tool_not_allowed'));
      }
      if (!toolIds.has(toolId)) {
        findings.push(finding(agent.id, 'blocker', 'required_tool_not_registered'));
      }
    }
  }
  return findings;
}

function finding(
  subjectId: string,
  severity: GovernanceSeverity,
  code: string,
): GovernanceFinding {
  return { subjectId, severity, code, message: code };
}
