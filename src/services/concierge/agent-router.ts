/**
 * Agent Auto-Router
 *
 * Analyzes user prompts and automatically routes to the best agent.
 * Uses intent classification and entity extraction.
 */

import { AgentRole } from '@/lib/gcm-types';
import {
  AgentSuggestion,
  IntentClassification,
  IntentType,
  DomainType,
  EntityType,
  ExtractedEntity,
} from './types';

/**
 * Agent routing patterns
 */
const ROUTING_PATTERNS = {
  // Sales patterns
  sales: {
    keywords: [
      'sales', 'revenue', 'income', 'earnings', 'turnover', 'liikevaihto', 'myynti',
      'tulot', 'tuotto', 'profit', 'voitto', 'margin', 'kate',
    ],
    intents: [IntentType.QUERY_DATA, IntentType.ANALYZE_TRENDS, IntentType.COMPARE_METRICS],
    entities: [EntityType.AMOUNT, EntityType.PERCENTAGE, EntityType.CATEGORY],
    agentRole: AgentRole.SALES_OPTIMIZER,
  },

  // Footfall patterns
  footfall: {
    keywords: [
      'footfall', 'visitors', 'traffic', 'flow', 'crowd', 'occupancy', 'capacity',
      'kävijät', 'kävijämäärä', 'liikenne', 'virtaus', 'väkimäärä', 'käyttöaste',
      'people', 'ihmiset', 'asiakkaat', 'customers',
    ],
    intents: [IntentType.QUERY_DATA, IntentType.ANALYZE_TRENDS, IntentType.OPTIMIZE],
    entities: [EntityType.LOCATION, EntityType.DATE_RANGE],
    agentRole: AgentRole.FOOTFALL_ANALYST,
  },

  // Events patterns
  events: {
    keywords: [
      'event', 'campaign', 'promotion', 'marketing', 'tapahtuma', 'kampanja',
      'alennusmyynti', 'markkinointi', 'plan', 'suunnittele', 'organize', 'järjestä',
      'schedule', 'aikataulu', 'holiday', 'juhlapäivä', 'season', 'kausi',
    ],
    intents: [IntentType.PLAN_EVENT, IntentType.ANALYZE_TRENDS, IntentType.GENERAL_QUESTION],
    entities: [EntityType.DATE, EntityType.DATE_RANGE, EntityType.EVENT],
    agentRole: AgentRole.EVENT_COORDINATOR,
  },

  // Parking patterns
  parking: {
    keywords: [
      'parking', 'pysäköinti', 'parkki', 'parkkipaikka', 'car', 'auto', 'vehicle', 'ajoneuvo',
      'space', 'tila', 'garage', 'parkkihalli', 'lot', 'alue',
    ],
    intents: [IntentType.QUERY_DATA, IntentType.OPTIMIZE, IntentType.TROUBLESHOOT],
    entities: [EntityType.LOCATION, EntityType.PERCENTAGE],
    agentRole: AgentRole.PARKING_MANAGER,
  },

  // Trends patterns
  trends: {
    keywords: [
      'trend', 'trendi', 'pattern', 'kuvio', 'forecast', 'ennuste', 'predict', 'ennusta',
      'future', 'tulevaisuus', 'growth', 'kasvu', 'decline', 'lasku', 'change', 'muutos',
      'correlation', 'korrelaatio', 'insight', 'näkemys', 'analysis', 'analyysi',
    ],
    intents: [IntentType.ANALYZE_TRENDS, IntentType.PREDICT, IntentType.COMPARE_METRICS],
    entities: [EntityType.DATE_RANGE, EntityType.METRIC],
    agentRole: AgentRole.TREND_ANALYST,
  },
};

/**
 * Intent patterns
 */
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  [IntentType.QUERY_DATA]: [
    /^(show|get|fetch|retrieve|find|display|näytä|hae|etsi)/i,
    /(what is|what are|how much|how many|mikä on|paljonko)/i,
    /(give me|anna minulle)/i,
  ],
  [IntentType.ANALYZE_TRENDS]: [
    /(analyze|analyse|analysoi|examine|tutki|study)/i,
    /(trend|pattern|kuvio|trendi)/i,
    /(over time|ajan mittaan)/i,
  ],
  [IntentType.COMPARE_METRICS]: [
    /(compare|vertaa|versus|vs|versus)/i,
    /(difference|ero|delta)/i,
    /(better|worse|parempi|huonompi)/i,
  ],
  [IntentType.GENERATE_REPORT]: [
    /(report|raportti|summary|yhteenveto|export|vie)/i,
    /(generate|create|luo)/i,
  ],
  [IntentType.PLAN_EVENT]: [
    /(plan|suunnittele|organize|järjestä|schedule|aikatauluta)/i,
    /(event|tapahtuma|campaign|kampanja)/i,
  ],
  [IntentType.OPTIMIZE]: [
    /(optimize|optimoi|improve|paranna|maximize|maksimoi|increase|lisää)/i,
    /(efficiency|tehokkuus|performance|suorituskyky)/i,
  ],
  [IntentType.PREDICT]: [
    /(predict|ennusta|forecast|ennuste|expect|odota)/i,
    /(will|tulee|future|tulevaisuus)/i,
  ],
  [IntentType.EXPLAIN]: [
    /(why|miksi|how|miten|explain|selitä|reason|syy)/i,
    /(caused|aiheutti|led to|johti)/i,
  ],
  [IntentType.TROUBLESHOOT]: [
    /(problem|ongelma|issue|asia|error|virhe|wrong|väärin)/i,
    /(fix|korjaa|solve|ratkaise)/i,
  ],
  [IntentType.GENERAL_QUESTION]: [
    /(what|mikä|who|kuka|when|milloin|where|missä)/i,
  ],
};

/**
 * Entity extraction patterns
 */
const ENTITY_PATTERNS: Record<EntityType, RegExp> = {
  [EntityType.DATE]: /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|today|yesterday|tomorrow|tänään|eilen|huomenna)\b/gi,
  [EntityType.DATE_RANGE]: /\b(last|past|this|next|previous) (week|month|quarter|year|viikko|kuukausi|kvartaali|vuosi)\b/gi,
  [EntityType.LOCATION]: /\b(tripla|sello|kaari|kamppi|itis|jumbo|floor \d+|kerros \d+|level \d+|taso \d+)\b/gi,
  [EntityType.CATEGORY]: /\b(fashion|food|electronics|entertainment|muoti|ruoka|elektroniikka|viihde)\b/gi,
  [EntityType.METRIC]: /\b(revenue|sales|footfall|visitors|occupancy|liikevaihto|myynti|kävijät)\b/gi,
  [EntityType.TENANT]: /\b(tenant|vuokralainen|store|myymälä|shop|kauppa)\b/gi,
  [EntityType.EVENT]: /\b(vappu|juhannus|christmas|joulu|easter|pääsiäinen|black friday)\b/gi,
  [EntityType.AMOUNT]: /€?\s*\d+([,.]\d+)?[kKmMbB]?/g,
  [EntityType.PERCENTAGE]: /\d+([,.]\d+)?\s*%/g,
};

/**
 * Agent Auto-Router Class
 */
export class AgentRouter {
  /**
   * Route user prompt to best agent
   */
  route(prompt: string, context?: { conversationHistory?: string[] }): AgentSuggestion {
    // 1. Classify intent
    const intent = this.classifyIntent(prompt);

    // 2. Extract entities
    const entities = this.extractEntities(prompt);

    // 3. Determine domain
    const domain = this.determineDomain(prompt, intent, entities);

    // 4. Match to agent
    const agentRole = this.matchAgent(domain, intent, entities, prompt);

    // 5. Calculate confidence
    const confidence = this.calculateConfidence(prompt, agentRole, domain, intent);

    // 6. Generate reasoning
    const reasoning = this.generateReasoning(agentRole, domain, intent, entities);

    // 7. Find alternatives
    const alternativeAgents = this.findAlternatives(agentRole, domain, confidence);

    return {
      agentRole,
      confidence,
      reasoning,
      alternativeAgents,
    };
  }

  /**
   * Classify user intent
   */
  private classifyIntent(prompt: string): IntentClassification {
    const promptLower = prompt.toLowerCase();
    const scores: Record<IntentType, number> = {} as Record<IntentType, number>;

    // Match against patterns
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(promptLower)) {
          score += 1;
        }
      }
      scores[intent as IntentType] = score;
    }

    // Get highest scoring intent
    const entries = Object.entries(scores);
    const [topIntent, topScore] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));

    const totalScore = entries.reduce((sum, [, score]) => sum + score, 0);
    const confidence = totalScore > 0 ? topScore / totalScore : 0;

    const entities = this.extractEntities(prompt);
    const domain = this.determineDomain(prompt, { intent: topIntent as IntentType } as IntentClassification, entities);

    // Determine complexity
    const complexity = this.determineComplexity(prompt, entities);

    return {
      intent: topIntent as IntentType,
      confidence,
      entities,
      domain,
      complexity,
    };
  }

  /**
   * Extract entities from prompt
   */
  private extractEntities(prompt: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    for (const [type, pattern] of Object.entries(ENTITY_PATTERNS)) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(prompt)) !== null) {
        entities.push({
          type: type as EntityType,
          value: match[0],
          confidence: 0.8, // Could be more sophisticated
          span: { start: match.index, end: match.index + match[0].length },
        });
      }
    }

    return entities;
  }

  /**
   * Determine domain from prompt, intent, and entities
   */
  private determineDomain(
    prompt: string,
    intent: IntentClassification,
    entities: ExtractedEntity[]
  ): DomainType {
    const promptLower = prompt.toLowerCase();
    const scores: Record<DomainType, number> = {} as Record<DomainType, number>;

    // Initialize scores
    Object.values(DomainType).forEach((domain) => {
      scores[domain] = 0;
    });

    // Score based on keywords
    for (const [domain, config] of Object.entries(ROUTING_PATTERNS)) {
      for (const keyword of config.keywords) {
        if (promptLower.includes(keyword.toLowerCase())) {
          const domainType = this.domainFromAgentRole(config.agentRole);
          scores[domainType] = (scores[domainType] || 0) + 1;
        }
      }
    }

    // Boost based on entities
    for (const entity of entities) {
      if (entity.type === EntityType.METRIC) {
        const metricLower = entity.value.toLowerCase();
        if (metricLower.includes('sales') || metricLower.includes('revenue')) {
          scores[DomainType.SALES] += 0.5;
        } else if (metricLower.includes('footfall') || metricLower.includes('visitor')) {
          scores[DomainType.FOOTFALL] += 0.5;
        } else if (metricLower.includes('parking') || metricLower.includes('occupancy')) {
          scores[DomainType.PARKING] += 0.5;
        }
      }
    }

    // Get highest scoring domain
    const entries = Object.entries(scores);
    const [topDomain] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));

    return (topDomain || DomainType.GENERAL) as DomainType;
  }

  /**
   * Match domain to agent
   */
  private matchAgent(
    domain: DomainType,
    intent: IntentClassification,
    entities: ExtractedEntity[],
    prompt: string
  ): AgentRole {
    const mapping: Record<DomainType, AgentRole> = {
      [DomainType.SALES]: AgentRole.SALES_OPTIMIZER,
      [DomainType.FOOTFALL]: AgentRole.FOOTFALL_ANALYST,
      [DomainType.EVENTS]: AgentRole.EVENT_COORDINATOR,
      [DomainType.PARKING]: AgentRole.PARKING_MANAGER,
      [DomainType.TRENDS]: AgentRole.TREND_ANALYST,
      [DomainType.OPERATIONS]: AgentRole.GENERAL_ASSISTANT,
      [DomainType.GENERAL]: AgentRole.GENERAL_ASSISTANT,
    };

    // Special case: if intent is PREDICT or ANALYZE_TRENDS, prefer Trend Analyst
    if (intent.intent === IntentType.PREDICT || intent.intent === IntentType.ANALYZE_TRENDS) {
      if (domain !== DomainType.EVENTS) {
        // Events still go to Event Coordinator
        return AgentRole.TREND_ANALYST;
      }
    }

    return mapping[domain] || AgentRole.GENERAL_ASSISTANT;
  }

  /**
   * Calculate confidence in routing decision
   */
  private calculateConfidence(
    prompt: string,
    agentRole: AgentRole,
    domain: DomainType,
    intent: IntentClassification
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost if domain strongly matches
    const domainFromAgent = this.domainFromAgentRole(agentRole);
    if (domainFromAgent === domain) {
      confidence += 0.2;
    }

    // Boost if prompt contains agent-specific keywords
    const promptLower = prompt.toLowerCase();
    const agentConfig = this.getAgentConfig(agentRole);
    if (agentConfig) {
      const keywordMatches = agentConfig.keywords.filter((kw) =>
        promptLower.includes(kw.toLowerCase())
      ).length;
      confidence += Math.min(0.3, keywordMatches * 0.1);
    }

    // Boost if intent is in agent's supported intents
    if (agentConfig && agentConfig.intents.includes(intent.intent)) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    agentRole: AgentRole,
    domain: DomainType,
    intent: IntentClassification,
    entities: ExtractedEntity[]
  ): string {
    const agentName = this.getAgentName(agentRole);
    const intentName = this.getIntentName(intent.intent);
    const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);

    let reasoning = `I've selected ${agentName} for this query. `;

    if (intent.intent === IntentType.QUERY_DATA) {
      reasoning += `You're asking for ${domainName.toLowerCase()} data, which is this agent's specialty.`;
    } else if (intent.intent === IntentType.ANALYZE_TRENDS) {
      reasoning += `You want to analyze trends, and this agent excels at ${domainName.toLowerCase()} analysis.`;
    } else if (intent.intent === IntentType.PLAN_EVENT) {
      reasoning += `You're planning something, which is perfect for the Event Coordinator.`;
    } else if (intent.intent === IntentType.OPTIMIZE) {
      reasoning += `You want to optimize ${domainName.toLowerCase()}, which matches this agent's capabilities.`;
    } else {
      reasoning += `This query relates to ${domainName.toLowerCase()}, which is this agent's domain.`;
    }

    if (entities.length > 0) {
      reasoning += ` I detected ${entities.length} relevant entities in your query.`;
    }

    return reasoning;
  }

  /**
   * Find alternative agents
   */
  private findAlternatives(
    primaryAgent: AgentRole,
    domain: DomainType,
    primaryConfidence: number
  ): Array<{ agentRole: AgentRole; confidence: number }> {
    const alternatives: Array<{ agentRole: AgentRole; confidence: number }> = [];

    // If confidence is low, suggest General Assistant
    if (primaryConfidence < 0.7) {
      alternatives.push({
        agentRole: AgentRole.GENERAL_ASSISTANT,
        confidence: 0.6,
      });
    }

    // If trend-related, suggest Trend Analyst as alternative
    if (primaryAgent !== AgentRole.TREND_ANALYST && domain !== DomainType.GENERAL) {
      alternatives.push({
        agentRole: AgentRole.TREND_ANALYST,
        confidence: 0.5,
      });
    }

    return alternatives.slice(0, 2); // Max 2 alternatives
  }

  /**
   * Determine query complexity
   */
  private determineComplexity(
    prompt: string,
    entities: ExtractedEntity[]
  ): 'simple' | 'moderate' | 'complex' {
    const words = prompt.split(/\s+/).length;
    const hasDateRange = entities.some((e) => e.type === EntityType.DATE_RANGE);
    const hasMultipleMetrics = entities.filter((e) => e.type === EntityType.METRIC).length > 1;

    if (words < 5 && entities.length <= 1) {
      return 'simple';
    } else if (words > 20 || hasDateRange || hasMultipleMetrics) {
      return 'complex';
    } else {
      return 'moderate';
    }
  }

  /**
   * Helper: Get agent config
   */
  private getAgentConfig(agentRole: AgentRole): typeof ROUTING_PATTERNS.sales | undefined {
    for (const config of Object.values(ROUTING_PATTERNS)) {
      if (config.agentRole === agentRole) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * Helper: Get domain from agent role
   */
  private domainFromAgentRole(agentRole: AgentRole): DomainType {
    const mapping: Record<AgentRole, DomainType> = {
      [AgentRole.SALES_OPTIMIZER]: DomainType.SALES,
      [AgentRole.FOOTFALL_ANALYST]: DomainType.FOOTFALL,
      [AgentRole.EVENT_COORDINATOR]: DomainType.EVENTS,
      [AgentRole.PARKING_MANAGER]: DomainType.PARKING,
      [AgentRole.TREND_ANALYST]: DomainType.TRENDS,
      [AgentRole.GENERAL_ASSISTANT]: DomainType.GENERAL,
    };
    return mapping[agentRole] || DomainType.GENERAL;
  }

  /**
   * Helper: Get agent display name
   */
  private getAgentName(agentRole: AgentRole): string {
    const names: Record<AgentRole, string> = {
      [AgentRole.SALES_OPTIMIZER]: 'Sales Optimizer',
      [AgentRole.FOOTFALL_ANALYST]: 'Footfall Analyst',
      [AgentRole.EVENT_COORDINATOR]: 'Event Coordinator',
      [AgentRole.PARKING_MANAGER]: 'Parking Manager',
      [AgentRole.TREND_ANALYST]: 'Trend Analyst',
      [AgentRole.GENERAL_ASSISTANT]: 'General Assistant',
    };
    return names[agentRole] || 'General Assistant';
  }

  /**
   * Helper: Get intent display name
   */
  private getIntentName(intent: IntentType): string {
    return intent.replace(/_/g, ' ').toLowerCase();
  }
}

/**
 * Singleton instance
 */
let agentRouterInstance: AgentRouter | null = null;

/**
 * Get agent router instance
 */
export function getAgentRouter(): AgentRouter {
  if (!agentRouterInstance) {
    agentRouterInstance = new AgentRouter();
  }
  return agentRouterInstance;
}

/**
 * Quick routing function
 */
export function routeToAgent(prompt: string): AgentSuggestion {
  const router = getAgentRouter();
  return router.route(prompt);
}
