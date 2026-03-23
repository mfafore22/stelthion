/**
 * Custom Agent Builder
 *
 * Allows users to create tailored agents by combining capabilities.
 */

import { AgentRole } from '@/lib/gcm-types';
import { CustomAgentConfig, AgentCapability } from './types';

/**
 * Available capabilities that can be combined
 */
export const AVAILABLE_CAPABILITIES: AgentCapability[] = [
  // Data Access Capabilities
  {
    id: 'sales-data',
    name: 'Sales Data Access',
    description: 'Access sales, revenue, and transaction data',
    category: 'data_access',
    tools: ['get_sales_data', 'get_transaction_history', 'get_category_sales'],
    ragEnabled: true,
  },
  {
    id: 'footfall-data',
    name: 'Footfall Data Access',
    description: 'Access visitor traffic and flow data',
    category: 'data_access',
    tools: ['get_footfall', 'get_traffic_flow', 'get_zone_occupancy'],
    ragEnabled: true,
  },
  {
    id: 'parking-data',
    name: 'Parking Data Access',
    description: 'Access parking occupancy and availability data',
    category: 'data_access',
    tools: ['get_parking_data', 'get_parking_zones', 'get_parking_history'],
    ragEnabled: true,
  },
  {
    id: 'event-data',
    name: 'Event Data Access',
    description: 'Access event schedules, campaigns, and promotions',
    category: 'data_access',
    tools: ['get_events', 'get_campaigns', 'get_event_performance'],
    ragEnabled: true,
  },
  {
    id: 'tenant-data',
    name: 'Tenant Data Access',
    description: 'Access tenant information and performance',
    category: 'data_access',
    tools: ['get_tenant_info', 'get_tenant_sales', 'get_lease_data'],
    ragEnabled: true,
  },

  // Analysis Capabilities
  {
    id: 'trend-analysis',
    name: 'Trend Analysis',
    description: 'Analyze trends and patterns over time',
    category: 'analysis',
    tools: ['analyze_trends', 'detect_patterns', 'calculate_growth'],
    ragEnabled: true,
  },
  {
    id: 'correlation-analysis',
    name: 'Correlation Analysis',
    description: 'Find correlations between different metrics',
    category: 'analysis',
    tools: ['calculate_correlation', 'multi_variate_analysis', 'factor_analysis'],
    ragEnabled: true,
  },
  {
    id: 'comparative-analysis',
    name: 'Comparative Analysis',
    description: 'Compare metrics across time periods, locations, or categories',
    category: 'analysis',
    tools: ['compare_periods', 'benchmark_analysis', 'variance_analysis'],
    ragEnabled: true,
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection',
    description: 'Identify unusual patterns and outliers',
    category: 'analysis',
    tools: ['detect_anomalies', 'outlier_detection', 'change_point_detection'],
    ragEnabled: false,
  },

  // Planning Capabilities
  {
    id: 'event-planning',
    name: 'Event Planning',
    description: 'Plan and schedule events and campaigns',
    category: 'planning',
    tools: ['create_event_plan', 'schedule_campaign', 'resource_allocation'],
    ragEnabled: true,
  },
  {
    id: 'forecasting',
    name: 'Forecasting',
    description: 'Predict future trends and metrics',
    category: 'planning',
    tools: ['forecast_sales', 'predict_footfall', 'demand_forecast'],
    ragEnabled: true,
  },
  {
    id: 'scenario-planning',
    name: 'Scenario Planning',
    description: 'Model different scenarios and outcomes',
    category: 'planning',
    tools: ['run_scenario', 'simulate_outcome', 'what_if_analysis'],
    ragEnabled: false,
  },

  // Reporting Capabilities
  {
    id: 'report-generation',
    name: 'Report Generation',
    description: 'Generate comprehensive reports',
    category: 'reporting',
    tools: ['generate_report', 'export_data', 'create_summary'],
    ragEnabled: true,
  },
  {
    id: 'visualization',
    name: 'Data Visualization',
    description: 'Create charts and visualizations',
    category: 'reporting',
    tools: ['create_chart', 'generate_dashboard', 'visualize_trends'],
    ragEnabled: false,
  },

  // Optimization Capabilities
  {
    id: 'sales-optimization',
    name: 'Sales Optimization',
    description: 'Optimize sales strategies and performance',
    category: 'optimization',
    tools: ['optimize_pricing', 'recommend_promotions', 'identify_opportunities'],
    ragEnabled: true,
  },
  {
    id: 'flow-optimization',
    name: 'Flow Optimization',
    description: 'Optimize visitor flow and space utilization',
    category: 'optimization',
    tools: ['optimize_layout', 'improve_flow', 'capacity_optimization'],
    ragEnabled: true,
  },
  {
    id: 'resource-optimization',
    name: 'Resource Optimization',
    description: 'Optimize staffing, parking, and resources',
    category: 'optimization',
    tools: ['optimize_staffing', 'optimize_parking', 'resource_allocation'],
    ragEnabled: false,
  },
];

/**
 * Pre-built agent templates
 */
export const AGENT_TEMPLATES: Partial<CustomAgentConfig>[] = [
  {
    name: 'Sales & Events Specialist',
    description: 'Combines sales analysis with event planning for campaign optimization',
    icon: '📊🎉',
    capabilities: AVAILABLE_CAPABILITIES.filter((c) =>
      ['sales-data', 'event-data', 'trend-analysis', 'event-planning', 'report-generation'].includes(c.id)
    ),
    temperature: 0.6,
  },
  {
    name: 'Customer Experience Analyst',
    description: 'Analyzes footfall, flow, and events to optimize customer experience',
    icon: '🚶✨',
    capabilities: AVAILABLE_CAPABILITIES.filter((c) =>
      ['footfall-data', 'event-data', 'flow-optimization', 'trend-analysis', 'visualization'].includes(c.id)
    ),
    temperature: 0.5,
  },
  {
    name: 'Operations Manager',
    description: 'Oversees parking, footfall, and resource allocation',
    icon: '🅿️📋',
    capabilities: AVAILABLE_CAPABILITIES.filter((c) =>
      ['parking-data', 'footfall-data', 'resource-optimization', 'anomaly-detection'].includes(c.id)
    ),
    temperature: 0.4,
  },
  {
    name: 'Strategic Planner',
    description: 'Long-term planning with forecasting and scenario analysis',
    icon: '🎯📈',
    capabilities: AVAILABLE_CAPABILITIES.filter((c) =>
      ['sales-data', 'footfall-data', 'forecasting', 'scenario-planning', 'comparative-analysis'].includes(c.id)
    ),
    temperature: 0.7,
  },
];

/**
 * Custom Agent Builder Class
 */
export class CustomAgentBuilder {
  /**
   * Create a custom agent from selected capabilities
   */
  build(config: {
    name: string;
    description: string;
    icon?: string;
    capabilityIds: string[];
    temperature?: number;
    ragEnabled?: boolean;
    createdBy: string;
    isPublic?: boolean;
  }): CustomAgentConfig {
    // Validate capabilities
    const capabilities = this.getCapabilities(config.capabilityIds);

    if (capabilities.length === 0) {
      throw new Error('At least one capability must be selected');
    }

    // Generate system prompt
    const systemPrompt = this.generateSystemPrompt(config.name, config.description, capabilities);

    // Determine RAG config
    const ragEnabled = config.ragEnabled ?? capabilities.some((c) => c.ragEnabled);
    const ragConfig = ragEnabled
      ? {
          enabled: true,
          topK: 5,
          minScore: 0.7,
        }
      : undefined;

    // Collect all tools
    const allTools = capabilities.flatMap((c) => c.tools);
    const uniqueTools = [...new Set(allTools)];

    return {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: config.description,
      icon: config.icon || '🤖',
      systemPrompt,
      capabilities,
      temperature: config.temperature ?? 0.5,
      maxToolIterations: 5,
      ragConfig,
      createdBy: config.createdBy,
      createdAt: new Date(),
      isPublic: config.isPublic ?? false,
    };
  }

  /**
   * Create from template
   */
  fromTemplate(templateIndex: number, userId: string): CustomAgentConfig {
    const template = AGENT_TEMPLATES[templateIndex];
    if (!template) {
      throw new Error('Template not found');
    }

    const capabilityIds = template.capabilities?.map((c) => c.id) || [];

    return this.build({
      name: template.name!,
      description: template.description!,
      icon: template.icon,
      capabilityIds,
      temperature: template.temperature,
      createdBy: userId,
      isPublic: false,
    });
  }

  /**
   * Clone an existing custom agent
   */
  clone(agent: CustomAgentConfig, userId: string, newName?: string): CustomAgentConfig {
    const capabilityIds = agent.capabilities.map((c) => c.id);

    return this.build({
      name: newName || `${agent.name} (Copy)`,
      description: agent.description,
      icon: agent.icon,
      capabilityIds,
      temperature: agent.temperature,
      ragEnabled: agent.ragConfig?.enabled,
      createdBy: userId,
      isPublic: false,
    });
  }

  /**
   * Modify an existing custom agent
   */
  modify(
    agent: CustomAgentConfig,
    updates: {
      name?: string;
      description?: string;
      icon?: string;
      capabilityIds?: string[];
      temperature?: number;
      ragEnabled?: boolean;
    }
  ): CustomAgentConfig {
    const capabilityIds = updates.capabilityIds || agent.capabilities.map((c) => c.id);

    return this.build({
      name: updates.name || agent.name,
      description: updates.description || agent.description,
      icon: updates.icon || agent.icon,
      capabilityIds,
      temperature: updates.temperature ?? agent.temperature,
      ragEnabled: updates.ragEnabled ?? agent.ragConfig?.enabled,
      createdBy: agent.createdBy,
      isPublic: agent.isPublic,
    });
  }

  /**
   * Validate agent configuration
   */
  validate(config: CustomAgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Agent name is required');
    }

    if (config.name.length > 50) {
      errors.push('Agent name must be 50 characters or less');
    }

    if (!config.description || config.description.trim().length === 0) {
      errors.push('Agent description is required');
    }

    if (config.capabilities.length === 0) {
      errors.push('At least one capability must be selected');
    }

    if (config.temperature < 0 || config.temperature > 1) {
      errors.push('Temperature must be between 0 and 1');
    }

    // Check for conflicting capabilities
    const categories = config.capabilities.map((c) => c.category);
    const hasPlanningAndOptimization =
      categories.includes('planning') && categories.includes('optimization');

    if (hasPlanningAndOptimization && config.temperature < 0.5) {
      errors.push('Planning and optimization capabilities work better with temperature ≥ 0.5');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get capabilities by IDs
   */
  private getCapabilities(ids: string[]): AgentCapability[] {
    return AVAILABLE_CAPABILITIES.filter((c) => ids.includes(c.id));
  }

  /**
   * Generate system prompt from capabilities
   */
  private generateSystemPrompt(
    name: string,
    description: string,
    capabilities: AgentCapability[]
  ): string {
    const capabilityDescriptions = capabilities.map((c) => `- ${c.name}: ${c.description}`).join('\n');

    const toolsList = capabilities.flatMap((c) => c.tools);
    const uniqueTools = [...new Set(toolsList)];

    return `You are ${name}, a specialized AI assistant for shopping mall management in Finland.

${description}

Your capabilities include:
${capabilityDescriptions}

Available tools: ${uniqueTools.join(', ')}

Guidelines:
- Always provide accurate, data-driven insights
- Use tools extensively to retrieve and analyze data
- Tailor your responses to the Finnish retail context (Tripla, Sello, Kaari, etc.)
- Be aware of Finnish holidays and seasons (Vappu, Juhannus, Christmas, etc.)
- Provide actionable recommendations
- If you're uncertain, acknowledge it and suggest alternatives
- Respect data privacy and tenant confidentiality

When analyzing data:
1. Retrieve relevant data using available tools
2. Analyze trends and patterns
3. Provide insights with context
4. Offer actionable recommendations
5. Visualize data when helpful

Remember: You're here to help mall operators make better decisions.`;
  }

  /**
   * Get recommended capabilities for a domain
   */
  getRecommendedCapabilities(domain: 'sales' | 'footfall' | 'events' | 'parking' | 'mixed'): AgentCapability[] {
    const recommendations: Record<string, string[]> = {
      sales: ['sales-data', 'trend-analysis', 'sales-optimization', 'report-generation', 'visualization'],
      footfall: ['footfall-data', 'trend-analysis', 'flow-optimization', 'anomaly-detection', 'visualization'],
      events: ['event-data', 'event-planning', 'correlation-analysis', 'report-generation', 'forecasting'],
      parking: ['parking-data', 'resource-optimization', 'anomaly-detection', 'trend-analysis'],
      mixed: [
        'sales-data',
        'footfall-data',
        'event-data',
        'trend-analysis',
        'comparative-analysis',
        'report-generation',
      ],
    };

    const capabilityIds = recommendations[domain] || recommendations.mixed;
    return this.getCapabilities(capabilityIds);
  }
}

/**
 * Singleton instance
 */
let customAgentBuilderInstance: CustomAgentBuilder | null = null;

/**
 * Get custom agent builder instance
 */
export function getCustomAgentBuilder(): CustomAgentBuilder {
  if (!customAgentBuilderInstance) {
    customAgentBuilderInstance = new CustomAgentBuilder();
  }
  return customAgentBuilderInstance;
}
