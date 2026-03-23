/**
 * Concierge Service
 *
 * Main exports for Concierge backend services
 */

// Types
export * from './types';

// Agent Router
export { AgentRouter, getAgentRouter, routeToAgent } from './agent-router';

// Custom Agent Builder
export {
  CustomAgentBuilder,
  getCustomAgentBuilder,
  AVAILABLE_CAPABILITIES,
  AGENT_TEMPLATES,
} from './custom-agent-builder';

// WebSocket Client
export {
  ConciergeWebSocketClient,
  createWebSocketClient,
  WSConnectionState,
} from './websocket-client';

// i18n
export {
  t,
  translateWithFallback,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  pluralize,
} from './i18n';
