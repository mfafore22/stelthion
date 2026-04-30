import finland from '../../../data/shoppermind/mega-scenarios/finland.json';
import sweden from '../../../data/shoppermind/mega-scenarios/sweden.json';

type Lang = 'fi' | 'en' | 'sv';

export interface MegaKeyNumber {
  label: string;
  value: string;
  hint?: string;
}

export interface MegaEvidencePoint { p: string; v: number }

export interface MegaEvidenceChart {
  label: string;
  unit?: string;
  series: MegaEvidencePoint[];
}

export interface MegaPath {
  id: string;
  title: string;
  tone: string;
  summary: string;
  macro: string;
  consumer: string;
  retail: string;
  property: string;
  mallImpact: string;
  keyNumbers?: MegaKeyNumber[];
  evidenceCharts?: MegaEvidenceChart[];
}

export interface MegaSource {
  id: string;
  url: string;
  publisher: string;
  title: string;
}

export interface MallKpi { label: string; target?: string; hint?: string }

export interface MallActions {
  name: string;
  context: string;
  items: string[];
  kpis?: MallKpi[];
}

export interface MegaScenarioResolved {
  id: string;
  country: string;
  timespan: string;
  updatedAt: string;
  placeholder: boolean;
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
  perMallOptions: Array<{ id: string; name: string }>;
  glossary: Record<string, string>;
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

export function getMegaScenario(
  country: string,
  lang: string,
  mallId: string | null | undefined,
): MegaScenarioResolved | null {
  const raw = SCENARIOS[country.toUpperCase()];
  if (!raw) return null;
  const L = pickLang(lang);
  const i = raw.i18n[L];
  const perMallMap = (i.actionsPerMall ?? {}) as Record<string, MallActions>;
  const perMallOptions = Object.entries(perMallMap).map(([id, m]) => ({ id, name: m.name }));
  const perMall = mallId && perMallMap[mallId] ? perMallMap[mallId] : null;
  return {
    id: raw.id,
    country: raw.country,
    timespan: raw.timespan,
    updatedAt: raw.updatedAt,
    placeholder: (raw as { placeholder?: boolean }).placeholder === true,
    title: i.title,
    intro: i.intro,
    redString: i.redString,
    pathsLabel: i.pathsLabel,
    paths: (i.paths as MegaPath[]) ?? [],
    actionsLabel: i.actionsLabel,
    actionsGeneralLabel: i.actionsGeneralLabel,
    actionsGeneral: i.actionsGeneral ?? [],
    actionsPerMallLabel: i.actionsPerMallLabel,
    perMall,
    perMallOptions,
    glossary: (raw.glossary?.[L] ?? {}) as Record<string, string>,
    sources: (raw.sources ?? []).map((s) => ({
      id: s.id,
      url: s.url,
      publisher: s.publisher,
      title: (s.title as Record<string, string>)[L],
    })),
  };
}
