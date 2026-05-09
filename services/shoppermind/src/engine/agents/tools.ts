import { textKey, type RuntimeToolDefinition } from '@stelthion/intelligence-runtime';

export const shopperMindToolDefinitions: RuntimeToolDefinition[] = [
  {
    id: 'shoppermind.market_overview.read',
    domain: 'shoppermind',
    description: textKey('shoppermind.tools.marketOverview'),
    requiredScopes: ['customerId', 'marketId'],
    inputContract: { name: 'ShopperMindMarketOverviewInput', version: '1' },
    outputContract: { name: 'ShopperMindMarketOverviewResponse', version: '1' },
  },
  {
    id: 'shoppermind.retrieval.search',
    domain: 'shoppermind',
    description: textKey('shoppermind.tools.retrievalSearch'),
    requiredScopes: ['customerId', 'marketId'],
    inputContract: { name: 'ShopperMindRetrievalInput', version: '1' },
    outputContract: { name: 'ShopperMindRetrievalCitation', version: '1' },
  },
  {
    id: 'shoppermind.campaign_idea.create',
    domain: 'shoppermind',
    description: textKey('shoppermind.tools.campaignIdea'),
    requiredScopes: ['customerId', 'marketId'],
    inputContract: { name: 'ShopperMindCampaignIdeaInput', version: '1' },
    outputContract: { name: 'ShopperMindCampaignIdeaResponse', version: '1' },
  },
  {
    id: 'imf.macro_context.read',
    domain: 'shared',
    description: textKey('shared.tools.imfMacroContext'),
    requiredScopes: ['customerId'],
    inputContract: { name: 'MacroContextRequest', version: '1' },
    outputContract: { name: 'MacroIndicatorSeries', version: '1' },
  },
];
