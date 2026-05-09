import { AgentRole } from '@/lib/gcm-types';
import {
  domainKeywordMap,
  getConciergeRuntimeRegistry,
  roleForAgent,
  runtimeDomainFor,
} from './agent-runtime-registry';
import {
  AgentSuggestion,
  DomainType,
  EntityType,
  ExtractedEntity,
  IntentClassification,
  IntentType,
} from './types';

const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  [IntentType.QUERY_DATA]: [/^(show|get|fetch|find|display|näytä|hae|etsi)/i, /(what|how many|mikä|paljonko|availability)/i],
  [IntentType.ANALYZE_TRENDS]: [/(analyze|analyse|analysoi|patterns?|trends?|trendit?|changed over time|over time)/i],
  [IntentType.COMPARE_METRICS]: [/(compare|comparison|vertaa|versus|vs|difference|ero|delta)/i],
  [IntentType.GENERATE_REPORT]: [/(report|raportti|summary|yhteenveto|export|generate|create|luo)/i],
  [IntentType.PLAN_EVENT]: [/(plan|suunnittele|organize|järjestä|schedule|event|campaign|kampanja)/i],
  [IntentType.OPTIMIZE]: [/(optimize|optimoi|improve|paranna|maximize|increase|lisää)/i],
  [IntentType.PREDICT]: [/(predict|ennusta|forecast|ennuste|future|tulevaisuus|will)/i],
  [IntentType.EXPLAIN]: [/(why|miksi|how|miten|explain|selitä|reason|syy)/i],
  [IntentType.TROUBLESHOOT]: [/(problem|ongelma|issue|error|virhe|fix|korjaa|solve)/i],
  [IntentType.GENERAL_QUESTION]: [/(hello|help|what can|tell me|general|kuka|milloin|missä)/i],
};

const ENTITY_PATTERNS: Record<EntityType, RegExp> = {
  [EntityType.DATE]: /\b(q[1-4]\s+\d{4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|today|yesterday|tomorrow|last week|last month|this month|tänään|eilen|huomenna)\b/gi,
  [EntityType.DATE_RANGE]: /\b(last|past|this|next|previous) (week|month|quarter|year|viikko|kuukausi|kvartaali|vuosi)\b/gi,
  [EntityType.LOCATION]: /\b(ideapark|tripla|floor \d+|kerros \d+|level \d+|taso \d+)\b/gi,
  [EntityType.CATEGORY]: /\b(fashion|food|electronics|clothing|groceries|muoti|ruoka|elektroniikka|viihde)\b/gi,
  [EntityType.METRIC]: /\b(revenue|sales|footfall|visitors|occupancy|parking|liikevaihto|myynti|kävijät)\b/gi,
  [EntityType.TENANT]: /\b(tenant|vuokralainen|store|myymälä|shop|kauppa)\b/gi,
  [EntityType.EVENT]: /\b(vappu|juhannus|christmas|joulu|easter|pääsiäinen|black friday)\b/gi,
  [EntityType.AMOUNT]: /€?\s*\d+([,.]\d+)?[kKmMbB]?/g,
  [EntityType.PERCENTAGE]: /\d+([,.]\d+)?\s*%/g,
};

export class AgentRouter {
  route(prompt: string, context?: { conversationHistory?: string[] }): AgentSuggestion {
    if (!prompt.trim()) return emptySuggestion();
    const enrichedPrompt = [context?.conversationHistory?.slice(-2).join(' '), prompt]
      .filter(Boolean)
      .join(' ');
    const intent = this.classifyIntent(enrichedPrompt);
    const entities = this.extractEntities(enrichedPrompt);
    const domain = this.determineDomain(enrichedPrompt, intent, entities);
    const route = getConciergeRuntimeRegistry().routeTask({
      prompt: enrichedPrompt,
      intent: intent.intent,
      domain: runtimeDomainFor(domain),
      scope: { customerId: 'concierge-routing' },
    });
    const agentRole = roleForAgent(route.agentId);
    return {
      agentRole,
      confidence: route.confidence,
      reasoning: route.reasons.join(', ') || 'fallback_agent',
      alternativeAgents: route.alternatives.map((item) => ({
        agentRole: roleForAgent(item.agentId),
        confidence: Math.min(item.confidence, Math.max(0, route.confidence - 0.05)),
      })),
    };
  }

  private classifyIntent(prompt: string): IntentClassification {
    const promptLower = prompt.toLowerCase();
    const scores = Object.fromEntries(
      Object.values(IntentType).map((intent) => [intent, 0]),
    ) as Record<IntentType, number>;
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      scores[intent as IntentType] = patterns.filter((pattern) =>
        pattern.test(promptLower)).length;
    }
    const entries = Object.entries(scores) as Array<[IntentType, number]>;
    const [topIntent, topScore] = pickIntent(entries);
    const total = entries.reduce((sum, [, score]) => sum + score, 0);
    const entities = this.extractEntities(prompt);
    const domain = this.determineDomain(prompt, { intent: topIntent } as IntentClassification, entities);
    return {
      intent: total > 0 ? topIntent : IntentType.GENERAL_QUESTION,
      confidence: total > 0 ? Math.max(topScore / total, 0.6) : 0,
      entities,
      domain,
      complexity: this.determineComplexity(prompt, entities),
    };
  }

  private extractEntities(prompt: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    for (const [type, pattern] of Object.entries(ENTITY_PATTERNS)) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(prompt)) !== null) {
        entities.push({
          type: type as EntityType,
          value: match[0],
          confidence: 0.8,
          span: { start: match.index, end: match.index + match[0].length },
        });
      }
    }
    return entities;
  }

  private determineDomain(
    prompt: string,
    _intent: IntentClassification,
    entities: ExtractedEntity[],
  ): DomainType {
    const scores = Object.fromEntries(
      Object.values(DomainType).map((domain) => [domain, 0]),
    ) as Record<DomainType, number>;
    const promptLower = prompt.toLowerCase();
    for (const [domain, keywords] of Object.entries(domainKeywordMap())) {
      scores[domain as DomainType] += keywords.filter((keyword) =>
        promptLower.includes(keyword.toLowerCase())).length;
    }
    for (const entity of entities) boostEntity(scores, entity);
    const [topDomain, score] = (Object.entries(scores) as Array<[DomainType, number]>)
      .reduce((a, b) => (b[1] > a[1] ? b : a));
    return score > 0 ? topDomain : DomainType.GENERAL;
  }

  private determineComplexity(
    prompt: string,
    entities: ExtractedEntity[],
  ): 'simple' | 'moderate' | 'complex' {
    const words = prompt.trim().split(/\s+/).filter(Boolean).length;
    const hasRange = entities.some((entity) => entity.type === EntityType.DATE_RANGE);
    const hasMultipleMetrics = entities.filter((entity) => entity.type === EntityType.METRIC).length > 1;
    if (words < 5 && entities.length <= 1) return 'simple';
    if (words > 20 || hasRange || hasMultipleMetrics) return 'complex';
    return 'moderate';
  }
}

function boostEntity(scores: Record<DomainType, number>, entity: ExtractedEntity): void {
  const value = entity.value.toLowerCase();
  if (entity.type !== EntityType.METRIC) return;
  if (value.includes('sales') || value.includes('revenue')) scores[DomainType.SALES] += 0.5;
  if (value.includes('footfall') || value.includes('visitor')) scores[DomainType.FOOTFALL] += 0.5;
  if (value.includes('parking') || value.includes('occupancy')) scores[DomainType.PARKING] += 0.5;
}

function pickIntent(entries: Array<[IntentType, number]>): [IntentType, number] {
  const priority = [
    IntentType.PREDICT,
    IntentType.COMPARE_METRICS,
    IntentType.ANALYZE_TRENDS,
    IntentType.PLAN_EVENT,
    IntentType.OPTIMIZE,
    IntentType.GENERATE_REPORT,
    IntentType.QUERY_DATA,
    IntentType.EXPLAIN,
    IntentType.TROUBLESHOOT,
    IntentType.GENERAL_QUESTION,
  ];
  return entries.reduce((best, item) => {
    if (item[1] > best[1]) return item;
    if (item[1] === best[1] && priority.indexOf(item[0]) < priority.indexOf(best[0])) {
      return item;
    }
    return best;
  });
}

function emptySuggestion(): AgentSuggestion {
  return {
    agentRole: AgentRole.GENERAL_ASSISTANT,
    confidence: 0.25,
    reasoning: 'empty_prompt',
    alternativeAgents: [],
  };
}

let agentRouterInstance: AgentRouter | null = null;

export function getAgentRouter(): AgentRouter {
  agentRouterInstance ??= new AgentRouter();
  return agentRouterInstance;
}

export function routeToAgent(prompt: string): AgentSuggestion {
  return getAgentRouter().route(prompt);
}
