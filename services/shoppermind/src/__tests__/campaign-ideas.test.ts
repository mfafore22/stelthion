import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateCampaignIdea,
  type CampaignIdeaInput,
  type CampaignIdeaLanguage,
} from '../engine/campaign-ideas.js';
import {
  setLLMClient,
  type LLMClient,
  type LLMStreamChunk,
} from '../engine/llm/client.js';

function input(overrides: Partial<CampaignIdeaInput> = {}): CampaignIdeaInput {
  return {
    phenomenonId: 'p-1',
    label: 'Finnish craft beer → spices',
    state: 'ACCELERATING',
    phenomenonType: 'TREND',
    primaryCountry: 'FI',
    culturalScope: 'COUNTRY',
    culturalLocality: 'FI',
    footTrafficScope: 'CITY',
    footTrafficLocality: 'Tampere',
    categories: ['food', 'beverage'],
    keywords: ['craft beer', 'spices'],
    compositeScore: 0.71,
    velocity: 0.18,
    summary: 'Spiced craft beers gaining traction in Tampere foodie circles.',
    retailerImpact: 'Restaurants and bottle shops both benefit.',
    opportunity: 'Cross-promotion between bottle shops and partner restaurants.',
    marketDisplay: 'Ideapark Lempäälä',
    industryFocus: 'retail',
    ...overrides,
  };
}

function stubReturning(text: string): LLMClient {
  return {
    async *chat(): AsyncIterable<LLMStreamChunk> {
      yield { type: 'text', text };
      yield { type: 'done' };
    },
  };
}

const goodJson = JSON.stringify({
  angle: 'Tie spiced-beer trend to a 7-day partner-restaurant night across two zones.',
  audience: '25–45 foodies and craft-beer enthusiasts inside Tampere catchment.',
  channels: ['Instagram Reels', 'Mall newsletter', 'Partner-restaurant CRM'],
  hook: 'Your favourite beer — in a flavour you have not tried.',
  cta: 'Book a tasting flight at the partner restaurant.',
  successMetric: 'Tasting bookings ≥ 200 over the 7-day window.',
  whyNow: 'Velocity is +0.18 in two weeks; signal strongest in Tampere.',
  rationale: 'Leverages identified demand in foodie segment with low production cost; measurable via partner POS.',
});

describe('generateCampaignIdea', () => {
  let savedClient: LLMClient | null;
  beforeEach(() => {
    savedClient = null;
  });
  afterEach(() => {
    if (savedClient) setLLMClient(savedClient);
  });

  it('returns a typed CampaignIdea matching the schema (en)', async () => {
    setLLMClient(stubReturning(goodJson));
    const idea = await generateCampaignIdea(input(), { language: 'en', budget: 'light', durationDays: 7 });

    expect(idea.phenomenonId).toBe('p-1');
    expect(idea.language).toBe('en');
    expect(idea.budgetTier).toBe('light');
    expect(idea.durationDays).toBe(7);
    expect(idea.channels).toHaveLength(3);
    expect(idea.hook).toContain('flavour');
    expect(idea.successMetric.length).toBeGreaterThan(0);
    expect(idea.whyNow.length).toBeGreaterThan(0);
  });

  it('passes language through to the result for fi and sv', async () => {
    for (const language of ['fi', 'sv'] as CampaignIdeaLanguage[]) {
      setLLMClient(stubReturning(goodJson));
      const idea = await generateCampaignIdea(input(), { language });
      expect(idea.language).toBe(language);
    }
  });

  it('clamps duration into [3, 60]', async () => {
    setLLMClient(stubReturning(goodJson));
    const tooShort = await generateCampaignIdea(input(), { durationDays: 1 });
    expect(tooShort.durationDays).toBe(3);

    setLLMClient(stubReturning(goodJson));
    const tooLong = await generateCampaignIdea(input(), { durationDays: 200 });
    expect(tooLong.durationDays).toBe(60);
  });

  it('falls back to localized stub content when LLM returns invalid JSON', async () => {
    setLLMClient(stubReturning('this is not JSON'));
    const idea = await generateCampaignIdea(input(), { language: 'fi' });
    expect(idea.language).toBe('fi');
    // Finnish fallback uses the label inline
    expect(idea.hook).toContain('Finnish craft beer → spices');
    expect(idea.channels.length).toBeGreaterThan(0);
  });

  it('strips markdown fences before parsing', async () => {
    setLLMClient(stubReturning('```json\n' + goodJson + '\n```'));
    const idea = await generateCampaignIdea(input());
    expect(idea.hook).toContain('flavour');
  });

  it('caps channels at 4 entries', async () => {
    const tooManyChannels = JSON.stringify({
      ...JSON.parse(goodJson),
      channels: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    setLLMClient(stubReturning(tooManyChannels));
    const idea = await generateCampaignIdea(input());
    expect(idea.channels).toHaveLength(4);
  });
});
