import finland from '../../../data/shoppermind/mega-scenarios/finland.json';

type Lang = 'fi' | 'en' | 'sv';

export interface MegaPath {
  id: string;
  title: string;
  tone: 'neutraali' | 'synkkä' | 'valoisa' | 'neutral' | 'dark' | 'bright';
  summary: string;
  macro: string;
  consumer: string;
  retail: string;
  property: string;
  mallImpact: string;
}

export interface MegaSource {
  id: string;
  url: string;
  publisher: string;
  title: string;
}

export interface MallActions {
  name: string;
  context: string;
  items: string[];
}

export interface MegaScenarioResolved {
  id: string;
  country: string;
  timespan: string;
  updatedAt: string;
  title: string;
  intro: string;
  redString: string;
  pathsLabel: string;
  paths: MegaPath[];
  actionsLabel: string;
  actionsGeneralLabel: string;
  actionsGeneral: string[];
  actionsPerMallLabel: string;
  perMall: MallActions | null;
  glossary: Record<string, string>;
  sources: MegaSource[];
}

const SCENARIOS: Record<string, typeof finland> = { FI: finland };

function pickLang(lang: string): Lang {
  const l = lang.slice(0, 2).toLowerCase();
  return l === 'fi' || l === 'sv' ? l : 'en';
}

export function getMegaScenario(country: string, lang: string, mallId: string | null | undefined): MegaScenarioResolved | null {
  const raw = SCENARIOS[country.toUpperCase()];
  if (!raw) return null;
  const L = pickLang(lang);
  const i = raw.i18n[L];
  const perMallMap = i.actionsPerMall as Record<string, MallActions>;
  const perMall = mallId && perMallMap[mallId] ? perMallMap[mallId] : null;
  return {
    id: raw.id,
    country: raw.country,
    timespan: raw.timespan,
    updatedAt: raw.updatedAt,
    title: i.title,
    intro: i.intro,
    redString: i.redString,
    pathsLabel: i.pathsLabel,
    paths: i.paths as MegaPath[],
    actionsLabel: i.actionsLabel,
    actionsGeneralLabel: i.actionsGeneralLabel,
    actionsGeneral: i.actionsGeneral,
    actionsPerMallLabel: i.actionsPerMallLabel,
    perMall,
    glossary: raw.glossary[L] as Record<string, string>,
    sources: raw.sources.map((s) => ({
      id: s.id,
      url: s.url,
      publisher: s.publisher,
      title: (s.title as Record<string, string>)[L],
    })),
  };
}
