import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgentGovernance } from '../governance.js';
import { literalText } from '../localized-text.js';
import type { AgentDefinition, RuntimeToolDefinition } from '../agent-types.js';

test('validateAgentGovernance blocks missing scope and tools', () => {
  const report = validateAgentGovernance([agent()], []);

  assert.equal(report.blockerCount, 2);
  assert.deepEqual(report.findings.map((item) => item.code), [
    'missing_scope_constraints',
    'required_tool_not_registered',
  ]);
});

test('validateAgentGovernance accepts scoped configured agents', () => {
  const tool: RuntimeToolDefinition = {
    id: 'tool.read',
    description: literalText('Read'),
    requiredScopes: ['customerId'],
    inputContract: { name: 'Input', version: '1' },
    outputContract: { name: 'Output', version: '1' },
  };
  const report = validateAgentGovernance([agent(['customerId'])], [tool]);

  assert.equal(report.blockerCount, 0);
  assert.equal(report.warningCount, 0);
});

function agent(scopeConstraints: AgentDefinition['scopeConstraints'] = []): AgentDefinition {
  return {
    id: 'agent',
    domain: 'shoppermind',
    label: literalText('Agent'),
    capabilities: [{
      id: 'capability',
      taskTypes: ['analysis'],
      intents: ['query_data'],
      requiredToolIds: ['tool.read'],
    }],
    allowedToolIds: ['tool.read'],
    memoryTiers: ['retrieval'],
    validation: [{ kind: 'source_count', required: true }],
    outputContract: { name: 'Output', version: '1' },
    scopeConstraints,
    routing: { keywords: [] },
  };
}
