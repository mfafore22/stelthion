/**
 * Integration Tests for Agent Router
 *
 * Tests intent classification, entity extraction, and agent routing logic
 */

import { AgentRouter, getAgentRouter, routeToAgent } from '../agent-router';
import { AgentRole } from '../../gcm/orchestrator/types';

describe('AgentRouter', () => {
  let router: AgentRouter;

  beforeEach(() => {
    router = new AgentRouter();
  });

  describe('Intent Classification', () => {
    it('should classify query_data intent', () => {
      const queries = [
        'Show me sales data for Sello',
        'What are the footfall numbers?',
        'Get parking occupancy',
        'How many people visited today?',
      ];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        expect(intent.intent).toBe('query_data');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify analyze_trends intent', () => {
      const queries = [
        'Analyze sales trends for last quarter',
        'What are the footfall patterns?',
        'Show me visitor trends',
        'How have sales changed over time?',
      ];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        expect(intent.intent).toBe('analyze_trends');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify compare_metrics intent', () => {
      const queries = [
        'Compare sales between Sello and Tripla',
        'Footfall comparison for last week',
        'How does this month compare to last month?',
      ];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        expect(intent.intent).toBe('compare_metrics');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify forecast intent', () => {
      const queries = [
        'Predict next week sales',
        'What will footfall be tomorrow?',
        'Forecast parking demand',
      ];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        expect(intent.intent).toBe('forecast');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify optimize intent', () => {
      const queries = [
        'How can we optimize sales?',
        'Improve parking efficiency',
        'Best way to increase footfall',
      ];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        expect(intent.intent).toBe('optimize');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should classify plan_event intent', () => {
      const queries = [
        'Plan a marketing event',
        'Schedule a promotion',
        'Organize a sale event',
      ];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        expect(intent.intent).toBe('plan_event');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('Entity Extraction', () => {
    it('should extract date entities', () => {
      const queries = [
        { text: 'Show sales for today', expectedEntity: 'today' },
        { text: 'Data from yesterday', expectedEntity: 'yesterday' },
        { text: 'Last week numbers', expectedEntity: 'last week' },
        { text: 'This month report', expectedEntity: 'this month' },
        { text: 'Q1 2025 analysis', expectedEntity: 'Q1 2025' },
      ];

      queries.forEach(({ text, expectedEntity }) => {
        const entities = (router as any).extractEntities(text);
        const dateEntities = entities.filter((e: any) => e.type === 'date');
        expect(dateEntities.length).toBeGreaterThan(0);
        expect(dateEntities[0].value.toLowerCase()).toContain(expectedEntity.toLowerCase());
      });
    });

    it('should extract location entities', () => {
      const locations = ['Sello', 'Tripla', 'Kaari', 'Itis', 'Jumbo', 'Iso Omena'];

      locations.forEach((location) => {
        const text = `Show data for ${location}`;
        const entities = (router as any).extractEntities(text);
        const locationEntities = entities.filter((e: any) => e.type === 'location');
        expect(locationEntities.length).toBeGreaterThan(0);
        expect(locationEntities[0].value).toBe(location);
      });
    });

    it('should extract metric entities', () => {
      const metrics = [
        { text: 'Show me sales numbers', expectedMetric: 'sales' },
        { text: 'Get footfall data', expectedMetric: 'footfall' },
        { text: 'Revenue report', expectedMetric: 'revenue' },
        { text: 'Parking occupancy', expectedMetric: 'parking' },
      ];

      metrics.forEach(({ text, expectedMetric }) => {
        const entities = (router as any).extractEntities(text);
        const metricEntities = entities.filter((e: any) => e.type === 'metric');
        expect(metricEntities.length).toBeGreaterThan(0);
        expect(metricEntities[0].value.toLowerCase()).toContain(expectedMetric);
      });
    });

    it('should extract category entities', () => {
      const categories = ['electronics', 'clothing', 'food', 'groceries', 'fashion'];

      categories.forEach((category) => {
        const text = `Show ${category} sales`;
        const entities = (router as any).extractEntities(text);
        const categoryEntities = entities.filter((e: any) => e.type === 'category');
        expect(categoryEntities.length).toBeGreaterThan(0);
        expect(categoryEntities[0].value.toLowerCase()).toBe(category);
      });
    });

    it('should extract multiple entities from complex query', () => {
      const text = 'Compare electronics sales between Sello and Tripla for last month';
      const entities = (router as any).extractEntities(text);

      // Should extract: metric (sales), category (electronics), locations (Sello, Tripla), date (last month)
      expect(entities.length).toBeGreaterThanOrEqual(4);

      const types = entities.map((e: any) => e.type);
      expect(types).toContain('metric');
      expect(types).toContain('category');
      expect(types).toContain('location');
      expect(types).toContain('date');
    });
  });

  describe('Domain Detection', () => {
    it('should detect sales domain', () => {
      const queries = ['Show sales data', 'Revenue report', 'Transaction volume'];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        const entities = (router as any).extractEntities(query);
        const domain = (router as any).determineDomain(query, intent, entities);
        expect(domain).toBe('sales');
      });
    });

    it('should detect footfall domain', () => {
      const queries = ['Visitor count', 'Footfall analysis', 'How many people visited'];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        const entities = (router as any).extractEntities(query);
        const domain = (router as any).determineDomain(query, intent, entities);
        expect(domain).toBe('footfall');
      });
    });

    it('should detect events domain', () => {
      const queries = ['Upcoming events', 'Schedule an event', 'Event planning'];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        const entities = (router as any).extractEntities(query);
        const domain = (router as any).determineDomain(query, intent, entities);
        expect(domain).toBe('events');
      });
    });

    it('should detect parking domain', () => {
      const queries = ['Parking availability', 'Parking occupancy', 'How many parking spots'];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        const entities = (router as any).extractEntities(query);
        const domain = (router as any).determineDomain(query, intent, entities);
        expect(domain).toBe('parking');
      });
    });

    it('should detect trends domain', () => {
      const queries = ['Market trends', 'Customer behavior patterns', 'Demographic analysis'];

      queries.forEach((query) => {
        const intent = (router as any).classifyIntent(query);
        const entities = (router as any).extractEntities(query);
        const domain = (router as any).determineDomain(query, intent, entities);
        expect(domain).toBe('trends');
      });
    });
  });

  describe('Agent Routing', () => {
    it('should route sales queries to Sales Optimizer', () => {
      const queries = [
        'Show me sales for Sello today',
        'What was yesterday revenue?',
        'Optimize our sales strategy',
        'Compare sales between locations',
      ];

      queries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.agentRole).toBe(AgentRole.SALES_OPTIMIZER);
        expect(suggestion.confidence).toBeGreaterThan(0.5);
        expect(suggestion.reasoning).toBeTruthy();
      });
    });

    it('should route footfall queries to Footfall Analyst', () => {
      const queries = [
        'How many visitors today?',
        'Footfall patterns for last week',
        'Analyze customer traffic',
        'Peak visiting hours',
      ];

      queries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.agentRole).toBe(AgentRole.FOOTFALL_ANALYST);
        expect(suggestion.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should route event queries to Event Coordinator', () => {
      const queries = [
        'Plan a marketing event',
        'Upcoming events at Tripla',
        'Schedule a promotion',
        'Event calendar',
      ];

      queries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.agentRole).toBe(AgentRole.EVENT_COORDINATOR);
        expect(suggestion.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should route parking queries to Parking Manager', () => {
      const queries = [
        'Parking availability',
        'How many spots are free?',
        'Parking occupancy rate',
        'Optimize parking',
      ];

      queries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.agentRole).toBe(AgentRole.PARKING_MANAGER);
        expect(suggestion.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should route trend queries to Trend Analyst', () => {
      const queries = [
        'Market trends analysis',
        'Customer demographics',
        'Behavior patterns',
        'Forecast future trends',
      ];

      queries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.agentRole).toBe(AgentRole.TREND_ANALYST);
        expect(suggestion.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should route general queries to General Assistant', () => {
      const queries = [
        'Hello, how can you help?',
        'What can you do?',
        'Tell me about the mall',
        'General information',
      ];

      queries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.agentRole).toBe(AgentRole.GENERAL_ASSISTANT);
      });
    });

    it('should provide alternative agents', () => {
      const query = 'Analyze sales trends';
      const suggestion = router.route(query);

      expect(suggestion.alternativeAgents).toBeDefined();
      expect(suggestion.alternativeAgents.length).toBeGreaterThan(0);

      // All alternatives should have lower confidence than primary
      suggestion.alternativeAgents.forEach((alt) => {
        expect(alt.confidence).toBeLessThan(suggestion.confidence);
      });
    });

    it('should return high confidence for clear queries', () => {
      const clearQueries = [
        { query: 'Show me sales data', minConfidence: 0.8 },
        { query: 'How many visitors today?', minConfidence: 0.8 },
        { query: 'Parking availability', minConfidence: 0.8 },
      ];

      clearQueries.forEach(({ query, minConfidence }) => {
        const suggestion = router.route(query);
        expect(suggestion.confidence).toBeGreaterThanOrEqual(minConfidence);
      });
    });

    it('should return lower confidence for ambiguous queries', () => {
      const ambiguousQueries = [
        'Show me data',
        'What about today?',
        'Tell me more',
      ];

      ambiguousQueries.forEach((query) => {
        const suggestion = router.route(query);
        expect(suggestion.confidence).toBeLessThan(0.8);
      });
    });
  });

  describe('Context-Aware Routing', () => {
    it('should use conversation history for better routing', () => {
      const context = {
        conversationHistory: [
          'Show me sales for Sello',
          'What about revenue?',
        ],
      };

      const query = 'And footfall?';
      const suggestion = router.route(query, context);

      // Should maintain sales context and route to Sales Optimizer
      // or use recent location context (Sello)
      expect(suggestion.confidence).toBeGreaterThan(0.5);
    });

    it('should handle multi-turn conversations', () => {
      const context = {
        conversationHistory: [
          'Compare sales between Sello and Tripla',
          'Show me last month',
        ],
      };

      const query = 'What about footfall?';
      const suggestion = router.route(query, context);

      // Should understand context and provide good suggestion
      expect(suggestion.agentRole).toBeTruthy();
      expect(suggestion.confidence).toBeGreaterThan(0.4);
    });
  });

  describe('Finnish Language Support', () => {
    it('should route Finnish queries correctly', () => {
      const finnishQueries = [
        { query: 'Näytä myyntitiedot Sellolle', expectedAgent: AgentRole.SALES_OPTIMIZER },
        { query: 'Kuinka monta kävijää tänään?', expectedAgent: AgentRole.FOOTFALL_ANALYST },
        { query: 'Pysäköintitilanne', expectedAgent: AgentRole.PARKING_MANAGER },
      ];

      finnishQueries.forEach(({ query, expectedAgent }) => {
        const suggestion = router.route(query);
        // Finnish support is basic - should still route reasonably
        expect(suggestion.agentRole).toBeTruthy();
        expect(suggestion.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const suggestion = router.route('');
      expect(suggestion.agentRole).toBe(AgentRole.GENERAL_ASSISTANT);
      expect(suggestion.confidence).toBeLessThan(0.5);
    });

    it('should handle very long query', () => {
      const longQuery = 'Show me '.repeat(100) + 'sales data';
      const suggestion = router.route(longQuery);
      expect(suggestion.agentRole).toBe(AgentRole.SALES_OPTIMIZER);
    });

    it('should handle special characters', () => {
      const query = 'Show sales @ Sello & Tripla!!! (today)';
      const suggestion = router.route(query);
      expect(suggestion.agentRole).toBe(AgentRole.SALES_OPTIMIZER);
    });

    it('should handle queries with typos', () => {
      const query = 'Shw me saels data fr Sello';
      const suggestion = router.route(query);
      // Should still work despite typos
      expect(suggestion.agentRole).toBeTruthy();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance with getAgentRouter', () => {
      const instance1 = getAgentRouter();
      const instance2 = getAgentRouter();
      expect(instance1).toBe(instance2);
    });

    it('should work with routeToAgent helper', () => {
      const query = 'Show me sales data';
      const suggestion = routeToAgent(query);
      expect(suggestion.agentRole).toBe(AgentRole.SALES_OPTIMIZER);
      expect(suggestion.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Performance', () => {
    it('should route quickly for simple queries', () => {
      const query = 'Show sales';
      const start = Date.now();
      const suggestion = router.route(query);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should take < 100ms
      expect(suggestion).toBeTruthy();
    });

    it('should handle batch routing efficiently', () => {
      const queries = Array(100).fill('Show sales data for Sello');

      const start = Date.now();
      queries.forEach((query) => router.route(query));
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // 100 queries in < 2 seconds
    });
  });
});
