import type {
  AgentDefinition,
  AgentRouteCandidate,
  AgentRouteDecision,
  AgentTask,
  RuntimeToolDefinition,
} from './agent-types.js';

export interface AgentRegistry {
  registerTool(tool: RuntimeToolDefinition): void;
  registerAgent(agent: AgentDefinition): void;
  getAgent(id: string): AgentDefinition | null;
  getTool(id: string): RuntimeToolDefinition | null;
  listAgents(domain?: string): AgentDefinition[];
  listTools(domain?: string): RuntimeToolDefinition[];
  routeTask(task: AgentTask): AgentRouteDecision;
}

export class InMemoryAgentRegistry implements AgentRegistry {
  private agents = new Map<string, AgentDefinition>();
  private tools = new Map<string, RuntimeToolDefinition>();

  registerTool(tool: RuntimeToolDefinition): void {
    this.tools.set(tool.id, copyTool(tool));
  }

  registerAgent(agent: AgentDefinition): void {
    const missingTools = agent.allowedToolIds.filter((toolId) => !this.tools.has(toolId));
    if (missingTools.length > 0) {
      throw new Error(`Agent ${agent.id} references missing tools: ${missingTools.join(',')}`);
    }
    this.agents.set(agent.id, clone(agent));
  }

  getAgent(id: string): AgentDefinition | null {
    const agent = this.agents.get(id);
    return agent ? clone(agent) : null;
  }

  getTool(id: string): RuntimeToolDefinition | null {
    const tool = this.tools.get(id);
    return tool ? copyTool(tool) : null;
  }

  listAgents(domain?: string): AgentDefinition[] {
    return Array.from(this.agents.values())
      .filter((agent) => !domain || agent.domain === domain)
      .map(clone);
  }

  listTools(domain?: string): RuntimeToolDefinition[] {
    return Array.from(this.tools.values())
      .filter((tool) => !domain || !tool.domain || tool.domain === domain)
      .map(copyTool);
  }

  routeTask(task: AgentTask): AgentRouteDecision {
    const candidates = this.listAgents(task.domain)
      .map((agent) => scoreAgent(agent, task))
      .filter((candidate): candidate is AgentRouteCandidate => candidate !== null)
      .sort((a, b) => b.confidence - a.confidence);

    const [top, ...rest] = candidates;
    if (top) return { ...top, alternatives: rest.slice(0, 2) };

    const fallback = this.listAgents().find((agent) => agent.routing.fallback);
    if (!fallback) throw new Error('No eligible agent registered for task');
    return {
      agentId: fallback.id,
      confidence: 0.25,
      reasons: ['fallback_agent'],
      alternatives: [],
    };
  }
}

function scoreAgent(
  agent: AgentDefinition,
  task: AgentTask,
): AgentRouteCandidate | null {
  const missingScopes = agent.scopeConstraints.filter((key) => !task.scope[key]);
  if (missingScopes.length > 0) return null;

  let score = agent.routing.fallback ? 0.25 : 0.35;
  const reasons: string[] = [];
  if (task.domain && agent.domain === task.domain) add(0.2, 'domain_match');

  for (const capability of agent.capabilities) {
    if (task.intent && capability.intents.includes(task.intent)) add(0.25, 'intent_match');
    if (task.taskType && capability.taskTypes.includes(task.taskType)) add(0.15, 'task_match');
  }

  const prompt = task.prompt.toLowerCase();
  const hits = agent.routing.keywords.filter((keyword) =>
    prompt.includes(keyword.toLowerCase())).length;
  if (hits > 0) add(Math.min(0.3, hits * 0.1), `keyword_hits=${hits}`);

  return { agentId: agent.id, confidence: Math.min(1, score), reasons };

  function add(value: number, reason: string): void {
    score += value;
    reasons.push(reason);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function copyTool(tool: RuntimeToolDefinition): RuntimeToolDefinition {
  return {
    ...tool,
    description: clone(tool.description),
    requiredScopes: [...tool.requiredScopes],
    inputContract: clone(tool.inputContract),
    outputContract: clone(tool.outputContract),
  };
}
