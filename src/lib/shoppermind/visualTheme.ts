import { getMallLogo } from '@/lib/mall/mallLogos';
import type { BannerVisual } from '@/components/mall/visuals/VisualBanner';
import { ASSISTANT_VISUALS, SECTION_VISUALS, TREND_VISUALS, type TaggedVisual } from './visualCatalog';

function taggedVisualSrc(parts: Array<string | null | undefined>, visuals: TaggedVisual[], fallback: BannerVisual) {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  const match = visuals
    .map((visual) => ({ visual, score: visual.tags.filter((tag) => text.includes(tag)).length }))
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
