// Codified trend taxonomy. Each domain corresponds to a row in the EU/UAE/FI/US
// trend-insights research the engine seeds from. Phenomena carry domain tags so
// downstream consumers (campaign-ideas, UI filters, admin curation) can group
// them without relying on free-text categories[].

export enum TrendDomain {
  VALUE_POLARIZATION = 'value-polarization',
  PRICE_HYPERSENSITIVITY = 'price-hypersensitivity',
  CONVENIENCE_FOOD = 'convenience-food',
  AI_SHOPPING = 'ai-shopping',
  HYPERMARKET_DECLINE = 'hypermarket-decline',
  PROXIMITY_RISE = 'proximity-rise',
  HEALTH_FUNCTIONAL_FOOD = 'health-functional-food',
  SUSTAINABILITY = 'sustainability',
  ECOMMERCE_GROCERY = 'ecommerce-grocery',
  GLP1_EFFECT = 'glp1-effect',
  NON_ALCOHOLIC_BEV = 'non-alcoholic-bev',
  EXPERIENTIAL_RETAIL = 'experiential-retail',
  CHALLENGER_BRANDS = 'challenger-brands',
  RETAIL_CONCENTRATION = 'retail-concentration',
  GENZ_PHYSICAL_RETURN = 'genz-physical-return',
  PREMIUMIZATION = 'premiumization',
  PRIVATE_LABEL = 'private-label',
}

export const TREND_DOMAINS = Object.values(TrendDomain);

// Deterministic keyword priors. When clustering or classification surfaces
// any of these terms, the corresponding domain can be auto-tagged before
// the LLM labeller runs. Keep terms specific enough to avoid false hits.
export const DOMAIN_KEYWORDS: Record<TrendDomain, string[]> = {
  [TrendDomain.VALUE_POLARIZATION]: ['squeezed middle', 'trade up', 'trade down', 'mid-tier collapse', 'value polarization'],
  [TrendDomain.PRICE_HYPERSENSITIVITY]: ['price hypersensitivity', 'shrinkflation', 'budget tightening', 'multi-store hopping'],
  [TrendDomain.CONVENIENCE_FOOD]: ['food-to-go', 'ready-to-eat', 'grab-and-go', 'meal kit', 'hot deli', 'food court'],
  [TrendDomain.AI_SHOPPING]: ['ai shopping', 'ai grocery', 'agentic ai', 'retail media network', 'dynamic pricing'],
  [TrendDomain.HYPERMARKET_DECLINE]: ['hypermarket decline', 'hyper format', 'large-format grocery', 'mall anchor pressure'],
  [TrendDomain.PROXIMITY_RISE]: ['proximity store', 'small-format grocery', 'drive-through grocery', 'click-and-collect'],
  [TrendDomain.HEALTH_FUNCTIONAL_FOOD]: ['functional food', 'protein', 'gut health', 'better-for-you', 'clean label', 'wellness'],
  [TrendDomain.SUSTAINABILITY]: ['sustainability', 'regenerative', 'green deal', 'sustainable packaging', 'food waste'],
  [TrendDomain.ECOMMERCE_GROCERY]: ['ecommerce grocery', 'online grocery', 'dark store', 'click and collect', 'q-commerce'],
  [TrendDomain.GLP1_EFFECT]: ['glp-1', 'glp1', 'ozempic', 'wegovy', 'mounjaro', 'weight-loss drug', 'semaglutide'],
  [TrendDomain.NON_ALCOHOLIC_BEV]: ['non-alcoholic', 'mocktail', 'alcohol-free', 'low-abv', 'sober curious'],
  [TrendDomain.EXPERIENTIAL_RETAIL]: ['experiential retail', 'third place', 'discovery shopping', 'mall events', 'phygital'],
  [TrendDomain.CHALLENGER_BRANDS]: ['challenger brand', 'dtc', 'flavor-forward', 'speed to shelf'],
  [TrendDomain.RETAIL_CONCENTRATION]: ['retail concentration', 'top-5 retailers', 'mid-tier squeeze', 'consolidation'],
  [TrendDomain.GENZ_PHYSICAL_RETURN]: ['gen z in-store', 'gen z physical retail', 'social shopping', 'in-store discovery'],
  [TrendDomain.PREMIUMIZATION]: ['premiumization', 'affordable luxury', 'premium private label', 'masstige'],
  [TrendDomain.PRIVATE_LABEL]: ['private label', 'own brand', 'store brand', 'good-better-best'],
};

export function inferDomainsFromText(input: { label?: string; description?: string; keywords?: string[] }): TrendDomain[] {
  const haystack = `${input.label ?? ''} ${input.description ?? ''} ${(input.keywords ?? []).join(' ')}`.toLowerCase();
  const hits = new Set<TrendDomain>();
  for (const [domain, terms] of Object.entries(DOMAIN_KEYWORDS) as [TrendDomain, string[]][]) {
    if (terms.some((term) => haystack.includes(term.toLowerCase()))) {
      hits.add(domain);
    }
  }
  return Array.from(hits);
}
