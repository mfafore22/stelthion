import { getMallLogo } from '@/lib/mall/mallLogos';
import type { BannerVisual } from '@/components/mall/visuals/VisualBanner';
import { ASSISTANT_VISUALS, SECTION_VISUALS, TREND_VISUALS, type TaggedVisual } from './visualCatalog';

const DIRECT_TREND_RULES: Array<{ title: string; patterns: string[] }> = [
  { title: 'New weight management', patterns: ['glp-1', 'glp1', 'ozempic', 'weight management', 'painonhallinta'] },
  { title: 'Digital grocery', patterns: ['digital-grocery', 'web grocery', 'e-commerce grocery', 'online grocery', 'verkkoruoka'] },
  { title: 'Physical return', patterns: ['physical-return', 'gen z', 'z generation', 'z-generation', 'nuoret aikuiset'] },
  { title: 'Challenger brands', patterns: ['challenger-brand', 'challenger brands', 'indie brand', 'direct-to-consumer'] },
  { title: 'AI shopping', patterns: ['ai-shopping', 'ai shopping', 'generative ai', 'tekoälyostos'] },
  { title: 'Experience-led retail', patterns: ['curated-discretionary', 'experiential', 'experience-led', 'elämys'] },
  { title: 'Proximity stores', patterns: ['proximity', 'neighbourhood', 'neighborhood', 'lähikauppa'] },
  { title: 'Omnichannel', patterns: ['frictionless-omnichannel', 'omnichannel', 'retail media', 'kaupan media', 'retail media-plattform', 'fulfilment platform'] },
  { title: 'Grocery frequency', patterns: ['grocery-frequency', 'daily essentials', 'päivittäistavara', 'dagligvar'] },
  { title: 'Health and wellness', patterns: ['health-beauty-wellness-frequency', 'service-led-ageing', 'beauty and wellness', 'kauneus ja terveys', 'terveys', 'kauneus', 'hyvinvointi', 'hälsa', 'skönhet', 'välmående', 'wellness'] },
  { title: 'Convenience food', patterns: ['convenience food', 'take-away', 'takeaway', 'fast food', 'quick food', 'noutoruoka'] },
  { title: 'Outdoor leisure', patterns: ['nordic outdoor', 'outdoor culture', 'outdoor leisure', 'friluftsliv', 'ulkoilu'] },
  { title: 'Circular commerce', patterns: ['circular-commerce', 'circular commerce', 'product-life', 'kiertokauppa', 'kiertotalous', 'kierrätys', 'sustainability', 'hållbarhet', 'cirkulär handel'] },
  { title: 'Food and dining', patterns: ['food and dining', 'food-led', 'fine dining', 'ravintola', 'ruoka ja juoma', 'ruoka ja ravintolat', 'mat och dryck'] },
  { title: 'Premium destination', patterns: ['premium destination', 'safe-hub-tourism', 'safe hub', 'luxury'] },
  { title: 'Smart value', patterns: ['smart-value-low-risk', 'smart value', 'private label', 'value polarization', 'low-risk spending'] },
];

function visualByTitle(title: string) {
  return TREND_VISUALS.find((visual) => typeof visual.src !== 'string' && visual.src.title === title)?.src;
}

function taggedVisualSrc(parts: Array<string | null | undefined>, visuals: TaggedVisual[], fallback: BannerVisual) {
  const normalizedParts = parts.filter(Boolean).map((part) => String(part).toLowerCase());
  const identityText = normalizedParts.slice(0, 3).join(' ');
  for (const rule of DIRECT_TREND_RULES) {
    if (rule.patterns.some((pattern) => identityText.includes(pattern) || normalizedParts[0]?.includes(pattern))) {
      return visualByTitle(rule.title) ?? fallback;
    }
  }
  const match = visuals
    .map((visual) => ({
      visual,
      score: visual.tags.reduce((sum, tag) => {
        const index = normalizedParts.findIndex((part) => part.includes(tag));
        if (index < 0) return sum;
        return sum + Math.max(1, 6 - index);
      }, 0),
    }))
    .sort((a, b) => b.score - a.score)[0];
  return match && match.score > 0 ? match.visual.src : fallback;
}

export function trendBannerSrc(...parts: Array<string | null | undefined>) {
  return taggedVisualSrc(parts, TREND_VISUALS, SECTION_VISUALS.overview);
}

export function signalBannerSrc(...parts: Array<string | null | undefined>) {
  const trendSrc = trendBannerSrc(...parts);
  return typeof trendSrc !== 'string' && trendSrc.title?.includes('Premium')
    ? SECTION_VISUALS['signal-premium']
    : SECTION_VISUALS['signal-market'];
}

export function sectionBannerSrc(section: 'overview' | 'actions' | 'competitors' | 'decision') {
  return SECTION_VISUALS[section];
}

export function pathBannerSrc(tone: string) {
  const normalized = tone.toLowerCase();
  if (normalized === 'synkkä' || normalized === 'dark') return SECTION_VISUALS['path-dark'];
  if (normalized === 'valoisa' || normalized === 'bright') return SECTION_VISUALS['path-bright'];
  return SECTION_VISUALS['path-neutral'];
}

export function assistantBannerSrc(id: string) {
  return ASSISTANT_VISUALS[id] ?? ASSISTANT_VISUALS.overview;
}

export function competitorLogoSrc(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('itis')) return '/visuals/competitors/itis.svg';
  if (normalized.includes('jumbo')) return '/visuals/competitors/jumbo-flamingo.svg';
  const mallLogo = getMallLogo(normalized.replace(/[,()]/g, '').trim());
  return mallLogo ?? null;
}
