import { getLLMClient, type LLMMessage, type LLMStreamChunk } from './llm';
import { getMarketProfile } from './markets';
import { inferCategories } from './relevance';

interface LabelResult {
  label: string;
  description: string;
  categories: string[];
  confidence: number;
}

export async function labelPhenomenon(
  signalTitles: string[],
  country: string,
): Promise<LabelResult> {
  const profile = getMarketProfile(country);
  const allowedCategories = profile?.categories ?? [];
  const industryFocus = profile?.industryFocus ?? 'general';

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a ${industryFocus}-industry trend analyst. Given signal titles from ${country}, produce a JSON object with keys: label (short name, 3-6 words), description (1-2 sentences), categories (array from: ${allowedCategories.join(', ')}), confidence (0-1). Return ONLY valid JSON, no markdown.`,
    },
    {
      role: 'user',
      content: `Signal titles:\n${signalTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
    },
  ];

  const text = await collectLLMText(messages, { temperature: 0.2 });
  try {
    const parsed = JSON.parse(text) as LabelResult;
    if (profile && (!parsed.categories || parsed.categories.length === 0)) {
      parsed.categories = inferCategories(signalTitles.join(' '), profile);
    }
    return parsed;
  } catch {
    const joined = signalTitles.join(' ');
    const inferred = profile ? inferCategories(joined, profile) : [];
    return {
      label: signalTitles[0]?.slice(0, 60) ?? 'Unnamed phenomenon',
      description: `Cluster of ${signalTitles.length} signals from ${country}.`,
      categories: inferred,
      confidence: 0.3,
    };
  }
}

export async function generateNarrative(
  country: string,
  phenomena: { label: string; description: string; compositeScore: number; state: string; velocity: number }[],
  language: string,
): Promise<string> {
  const profile = getMarketProfile(country);
  const persona = profile?.narrativePersona ?? 'industry analyst';

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are writing the daily "Signal of the Day" briefing. Persona: ${persona}\n\nWrite 2-3 paragraphs in ${language}. Be concrete, cite the phenomena by name, note which are accelerating vs. fading. Keep it professional but insightful — this goes to industry operators.`,
    },
    {
      role: 'user',
      content: `Top phenomena for ${country} today:\n${phenomena.map((p, i) => `${i + 1}. ${p.label} [${p.state}] — score ${p.compositeScore.toFixed(2)}, velocity ${p.velocity > 0 ? '+' : ''}${p.velocity.toFixed(1)}\n   ${p.description}`).join('\n')}`,
    },
  ];

  return collectLLMText(messages, { temperature: 0.7 });
}

export async function decideMerge(
  clusterA: { label: string; titles: string[] },
  clusterB: { label: string; titles: string[] },
): Promise<{ merge: boolean; preferredLabel: string; rationale: string }> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You decide if two signal clusters represent the same phenomenon. Return JSON with keys: merge (boolean), preferredLabel (string), rationale (string). Return ONLY valid JSON.',
    },
    {
      role: 'user',
      content: `Cluster A: "${clusterA.label}"\nSamples: ${clusterA.titles.slice(0, 5).join('; ')}\n\nCluster B: "${clusterB.label}"\nSamples: ${clusterB.titles.slice(0, 5).join('; ')}`,
    },
  ];

  const text = await collectLLMText(messages, { temperature: 0.2 });
  try {
    return JSON.parse(text);
  } catch {
    return { merge: false, preferredLabel: clusterA.label, rationale: 'LLM response unparseable' };
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
