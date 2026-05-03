import { AgentRole } from '@/lib/gcm-types';

export interface AssistantDemoCard {
  id: string;
  agentRole: AgentRole;
  tools: string[];
  tone: 'primary' | 'teal' | 'amber' | 'violet';
}

export const ASSISTANT_DEMOS: AssistantDemoCard[] = [
  {
    id: 'owner-copilot',
    agentRole: AgentRole.GENERAL_ASSISTANT,
    tools: ['KPIs', 'briefing', 'approvals'],
    tone: 'primary',
  },
  {
    id: 'trend-analyst',
    agentRole: AgentRole.TREND_ANALYST,
    tools: ['ShopperMind', 'sources', 'campaign idea'],
    tone: 'teal',
  },
  {
    id: 'campaign-designer',
    agentRole: AgentRole.EVENT_COORDINATOR,
    tools: ['campaigns', 'events', 'footfall'],
    tone: 'amber',
  },
  {
    id: 'space-optimizer',
    agentRole: AgentRole.SALES_OPTIMIZER,
    tools: ['space optimizer', 'tenant mix', 'sales'],
    tone: 'violet',
  },
];
