import finland from '../../../data/shoppermind/mega-scenarios/finland.json';
import sweden from '../../../data/shoppermind/mega-scenarios/sweden.json';
import reportSources from '../../../data/shoppermind/report-sources.json';
import curatedTrendsData from '../../../data/shoppermind/curated-trends.json';

type Lang = 'fi' | 'en' | 'sv';
type Horizon = 'short' | 'medium' | 'long';

export interface MegaKeyNumber { label: string; value: string; hint?: string }
export interface MegaEvidencePoint { p: string; v: number }
export interface MegaEvidenceChart { label: string; unit?: string; series: MegaEvidencePoint[] }

export interface MegaPath {
  id: string; title: string; tone: string; summary: string;
  macro: string; consumer: string; retail: string; property: string; mallImpact: string;
  keyNumbers?: MegaKeyNumber[];
  evidenceCharts?: MegaEvidenceChart[];
}

export interface MegaSource { id: string; url: string; publisher: string; title: string }
export interface MallKpi { label: string; target?: string; hint?: string }

export interface MallActions {
  name: string;
  context: string;
  items: string[];
  kpis?: MallKpi[];
  operator?: string;
  isCompetitor?: boolean;
}

export interface MegaScenarioResolved {
  id: string; country: string; timespan: string; updatedAt: string; placeholder: boolean;
  title: string; intro: string; redString: string; pathsLabel: string; paths: MegaPath[];
  actionsLabel: string; actionsGeneralLabel: string; actionsGeneral: string[];
  actionsPerMallLabel: string;
  perMall: MallActions | null;
  perMallOptions: Array<{ id: string; name: string; operator?: string; isCompetitor?: boolean }>;
  glossary: Record<string, string>;
  sources: MegaSource[];
}

export interface CuratedCampaign { name: string; mallIds?: string[] }
export interface CuratedTrendResolved {
  id: string;
  horizon: Horizon;
  countries: string[];
  mallFormat: 'transit' | 'mixed-use' | 'destination' | 'all';
  state: string;
  confidence: number;
  label: string;
  marketsNote: string;
  body: string;
  mallImplications: string[];
  opportunities: string[];
  campaigns: CuratedCampaign[];
  sources: MegaSource[];
}

const SCENARIOS: Record<string, typeof finland> = {
  FI: finland,
  SE: sweden as unknown as typeof finland,
};

export const SUPPORTED_COUNTRIES = ['FI', 'SE'] as const;
export const STUB_COUNTRIES = ['US', 'UAE', 'KR', 'EU'] as const;
export const ALL_COUNTRIES = [...SUPPORTED_COUNTRIES, ...STUB_COUNTRIES] as const;

function pickLang(lang: string): Lang {
  const l = lang.slice(0, 2).toLowerCase();
  return l === 'fi' || l === 'sv' ? l : 'en';
}

function resolveSourceIds(ids: string[], L: Lang): MegaSource[] {
  return ids
    .map((id) => reportSources.sources.find((s) => s.id === id))
    .filter((s): s is (typeof reportSources.sources)[number] => Boolean(s))
    .map((s) => ({ id: s.id, url: s.url, publisher: s.publisher, title: (s.title as Record<string, string>)[L] }));
}

export function getMegaScenario(country: string, lang: string, mallId: string | null | undefined): MegaScenarioResolved | null {
  const raw = SCENARIOS[country.toUpperCase()];
  if (!raw) return null;
  const L = pickLang(lang);
  const i = raw.i18n[L];
  const perMallMap = (i.actionsPerMall ?? {}) as Record<string, MallActions>;
  const perMallOptions = Object.entries(perMallMap).map(([id, m]) => ({
    id, name: m.name, operator: m.operator, isCompetitor: m.isCompetitor,
  }));
  const perMall = mallId && perMallMap[mallId] ? perMallMap[mallId] : null;
  return {
    id: raw.id, country: raw.country, timespan: raw.timespan, updatedAt: raw.updatedAt,
    placeholder: (raw as { placeholder?: boolean }).placeholder === true,
    title: i.title, intro: i.intro, redString: i.redString, pathsLabel: i.pathsLabel,
    paths: (i.paths as MegaPath[]) ?? [],
    actionsLabel: i.actionsLabel, actionsGeneralLabel: i.actionsGeneralLabel,
    actionsGeneral: i.actionsGeneral ?? [],
    actionsPerMallLabel: i.actionsPerMallLabel,
    perMall, perMallOptions,
    glossary: (raw.glossary?.[L] ?? {}) as Record<string, string>,
    sources: (raw.sources ?? []).map((s) => ({
      id: s.id, url: s.url, publisher: s.publisher, title: (s.title as Record<string, string>)[L],
    })),
  };
}

export function getCuratedTrends(country: string, lang: string, mallId?: string | null): CuratedTrendResolved[] {
  const L = pickLang(lang);
  const upper = country.toUpperCase();
  return curatedTrendsData.trends
    .filter((t) => t.countries.includes(upper))
    .map((t) => {
      const impl = (t.mallImplications as Record<string, Record<Lang, string[]>>);
      const mallImpl = mallId && impl[mallId] ? impl[mallId][L] : [];
      return {
        id: t.id,
        horizon: t.horizon as Horizon,
        countries: t.countries,
        mallFormat: t.mallFormat as CuratedTrendResolved['mallFormat'],
        state: t.state,
        confidence: t.confidence,
        label: t.label[L],
        marketsNote: t.marketsNote[L],
        body: t.body[L],
        mallImplications: mallImpl,
        opportunities: (t.opportunities as Record<Lang, string[]>)[L],
        campaigns: t.campaigns,
        sources: resolveSourceIds(t.sourceIds, L),
      };
    });
}

export function getCuratedTrendsByHorizon(country: string, lang: string, horizon: Horizon, mallId?: string | null): CuratedTrendResolved[] {
  return getCuratedTrends(country, lang, mallId).filter((t) => t.horizon === horizon);
}
