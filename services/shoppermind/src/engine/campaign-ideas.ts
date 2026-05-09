import { getLLMClient, type LLMMessage, type LLMStreamChunk } from './llm/client.js';
import { fallback, normalizeCampaignHook } from './campaign-copy.js';

export type CampaignIdeaBudget = 'light' | 'standard' | 'premium';
export type CampaignIdeaLanguage = 'fi' | 'en' | 'sv';

export interface CampaignIdeaInput {
  phenomenonId: string;
  label: string;
  state: string;
  phenomenonType: string | null;
  primaryCountry: string;
  culturalScope: string | null;
  culturalLocality: string | null;
  footTrafficScope: string | null;
  footTrafficLocality: string | null;
  categories: string[];
  keywords: string[];
  compositeScore: number;
  velocity: number;
  summary: string;
  retailerImpact: string | null;
  opportunity: string | null;
  marketDisplay: string;
  industryFocus: string | null;
}

export interface CampaignIdeaOptions {
  language?: CampaignIdeaLanguage;
  angle?: string;
  audience?: string;
  budget?: CampaignIdeaBudget;
  durationDays?: number;
}

export interface CampaignIdea {
  phenomenonId: string;
  language: CampaignIdeaLanguage;
  angle: string;
  audience: string;
  channels: string[];
  hook: string;
  cta: string;
  successMetric: string;
  whyNow: string;
  budgetTier: CampaignIdeaBudget;
  durationDays: number;
  rationale: string;
}

const LANG_NAME: Record<CampaignIdeaLanguage, string> = {
  fi: 'Finnish (Finland)',
  en: 'English',
  sv: 'Swedish',
};

const BUDGET_HINT: Record<CampaignIdeaBudget, string> = {
  light: 'small budget, lean execution (organic + 1 paid channel max)',
  standard: 'mid-tier budget, multi-channel paid + earned media mix',
  premium: 'large budget, integrated paid+owned+earned with venue events',
};

export async function generateCampaignIdea(
  input: CampaignIdeaInput,
  opts: CampaignIdeaOptions = {},
): Promise<CampaignIdea> {
  const language: CampaignIdeaLanguage = opts.language ?? 'en';
  const budget: CampaignIdeaBudget = opts.budget ?? 'standard';
  const durationDays = clampDuration(opts.durationDays);

  const localeName = LANG_NAME[language];
  const budgetHint = BUDGET_HINT[budget];

  const constraints: string[] = [];
  if (opts.angle) constraints.push(`Angle to use: "${opts.angle}".`);
  if (opts.audience) constraints.push(`Target audience: "${opts.audience}".`);
  constraints.push(`Budget tier: ${budget}: ${budgetHint}.`);
  constraints.push(`Duration: roughly ${durationDays} days.`);

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: [
        `You are a senior retail/marketing strategist briefing a ${input.industryFocus ?? 'shopping-mall'} operator.`,
        `Produce a CONCRETE, actionable campaign idea grounded in the trend below.`,
        `Output language: ${localeName}. All free-text fields must be written in ${localeName}.`,
        `Return ONLY valid JSON. No markdown fences, no commentary outside the JSON.`,
        `JSON shape:`,
        `{`,
        `  "angle": string,         // 1 short paragraph (max 280 chars), the strategic angle`,
        `  "audience": string,      // single line, who this targets and why`,
        `  "channels": string[],    // 2 to 4 distribution channels, short noun phrases`,
        `  "hook": string,          // single line, customer-facing tagline (quote-worthy)`,
        `  "cta": string,           // single line, customer action verb leading`,
        `  "successMetric": string, // single line, MEASURABLE: KPI + target shape`,
        `  "whyNow": string,        // single line, ties to the trend's state and velocity`,
        `  "rationale": string      // 1 short paragraph (max 320 chars), internal-facing reasoning`,
        `}`,
        `Keep tone professional and grounded. No hype. Avoid generic "engage your audience" filler.`,
        `The hook must not follow the pattern "(trend), now in/at (place)". Vary the concept: route, mission, challenge, service promise, measurable trial, partner bundle, or event moment.`,
        `Do not use em dash characters. Use periods, commas, colons, or parentheses.`,
        language === 'fi'
          ? `Finnish: keep market/city names in nominative case (do not append -ssa/-ssä mechanically; consonant gradation breaks). Translate trend state to Finnish (kiihtyvä, nouseva, vakaa, hiipuva, lepotilassa). Use "kiinteistödata" instead of "venue-data".`
          : language === 'sv'
            ? `Swedish: translate trend state (accelererande, framväxande, stabil, avtagande, vilande). Use "fastighetsdata" instead of "venue-data".`
            : `English: keep state lowercased mid-sentence (accelerating, emerging, stable, fading, dormant).`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Mall / market: ${input.marketDisplay} (${input.primaryCountry})`,
        `Trend label: ${input.label}`,
        `Trend state: ${input.state}${input.phenomenonType ? ` (${input.phenomenonType})` : ''}`,
        `Composite score: ${input.compositeScore.toFixed(2)}, velocity: ${formatVelocity(input.velocity)}`,
        scopeLine('Cultural scope', input.culturalScope, input.culturalLocality),
        scopeLine('Foot-traffic scope', input.footTrafficScope, input.footTrafficLocality),
        input.categories.length ? `Categories: ${input.categories.join(', ')}` : null,
        input.keywords.length ? `Keywords: ${input.keywords.slice(0, 12).join(', ')}` : null,
        '',
        `Summary: ${input.summary}`,
        input.retailerImpact ? `Retailer impact: ${input.retailerImpact}` : null,
        input.opportunity ? `Opportunity: ${input.opportunity}` : null,
        '',
        `Constraints:`,
        ...constraints.map((c) => `- ${c}`),
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];

  const text = await collectLLMText(messages, { temperature: 0.6 });
  const parsed = safeParse(text);

  if (parsed) {
    return {
      phenomenonId: input.phenomenonId,
      language,
      angle: trimmed(parsed.angle, fallback(input, language).angle),
      audience: trimmed(parsed.audience, fallback(input, language).audience),
      channels: arr(parsed.channels, fallback(input, language).channels),
      hook: normalizeCampaignHook(parsed.hook, input, language),
      cta: trimmed(parsed.cta, fallback(input, language).cta),
      successMetric: trimmed(parsed.successMetric, fallback(input, language).successMetric),
      whyNow: trimmed(parsed.whyNow, fallback(input, language).whyNow),
      budgetTier: budget,
      durationDays,
      rationale: trimmed(parsed.rationale, fallback(input, language).rationale),
    };
  }

  return {
    phenomenonId: input.phenomenonId,
    language,
    budgetTier: budget,
    durationDays,
    ...fallback(input, language),
  };
}

function scopeLine(label: string, scope: string | null, locality: string | null): string | null {
  if (!scope && !locality) return null;
  return `${label}: ${[scope, locality].filter(Boolean).join(' · ')}`;
}

function formatVelocity(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}`;
}

function clampDuration(d: number | undefined): number {
  if (typeof d !== 'number' || !Number.isFinite(d)) return 14;
  return Math.max(3, Math.min(60, Math.round(d)));
}

function trimmed(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const t = value.trim();
  return t.length > 0 ? t : fallback;
}

function arr(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);
  return cleaned.length > 0 ? cleaned.slice(0, 4) : fallback;
}

function safeParse(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    const obj = JSON.parse(candidate);
    return typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function collectLLMText(
  messages: LLMMessage[],
  options?: { temperature?: number },
): Promise<string> {
  const client = getLLMClient();
  let text = '';
  const stream: AsyncIterable<LLMStreamChunk> = client.chat(messages, undefined, options);
  for await (const chunk of stream) {
    if (chunk.type === 'text' && chunk.text) text += chunk.text;
    if (chunk.type === 'error') throw new Error(chunk.error);
  }
  return text.trim();
}
