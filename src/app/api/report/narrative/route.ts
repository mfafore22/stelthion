import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * POST /api/report/narrative — Generate LLM narrative for a report.
 *
 * Calls local Ollama to produce an executive summary and highlights
 * from the current flow analysis state. Falls back to a template-based
 * summary if Ollama is unavailable.
 *
 * Body: { mallName, floor, hour, zones: [{name, visitors, density, capacity, delta}], flowQuery?, language? }
 * Returns: { narrative: string, highlights: string[] }
 */

interface ZoneInput {
  name: string;
  visitors: number;
  density: number;
  capacity: number;
  delta: number;
}

interface NarrativeRequest {
  mallName: string;
  floor: string;
  hour: number;
  zones: ZoneInput[];
  flowQuery?: {
    direction: string;
    originName: string;
    totalVisitors: number;
    edges: { fromName: string; toName: string; visitors: number; share: number }[];
  };
  language?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: NarrativeRequest = await req.json();
  const { mallName, floor, hour, zones, flowQuery, language = 'en' } = body;

  const prompt = buildPrompt(mallName, floor, hour, zones, flowQuery, language);

  const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 1024 },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data = await res.json();
    const response: string = data.response ?? '';

    // Parse: summary section + highlights
    const parts = response.split(/\n(?=(?:Key )?Highlights?:)/i);
    const narrative = parts[0]?.trim() || '';

    let highlights: string[] = [];
    if (parts[1]) {
      highlights = parts[1]
        .replace(/^(?:Key )?Highlights?:\s*/i, '')
        .split(/\n[-•*]\s*/)
        .map((h: string) => h.trim())
        .filter(Boolean);
    }

    return NextResponse.json({ narrative, highlights });
  } catch {
    // Ollama not available — return fallback
    const fallback = generateFallback(mallName, floor, hour, zones, flowQuery);
    return NextResponse.json(fallback);
  }
}

function buildPrompt(
  mallName: string,
  floor: string,
  hour: number,
  zones: ZoneInput[],
  flowQuery: NarrativeRequest['flowQuery'],
  language: string,
): string {
  const langName = language === 'fi' ? 'Finnish' : language === 'sv' ? 'Swedish' : 'English';

  const lines: string[] = [
    `You are a retail analytics expert writing an executive summary for a visitor flow analysis report for ${mallName} shopping center.`,
    ``,
    `Write:`,
    `1. A 2-3 paragraph executive summary describing traffic patterns, notable zones, and any flow dynamics`,
    `2. Then write "Highlights:" followed by 3-5 key bullet points`,
    ``,
    `Write in a professional, concise tone suitable for mall management. Respond in ${langName}.`,
    ``,
    `Data snapshot:`,
    `- Floor: ${floor}`,
    `- Time: ${hour}:00`,
    `- Total zones: ${zones.length}`,
    `- Total visitors: ${zones.reduce((s, z) => s + z.visitors, 0)}`,
    ``,
    `Zone breakdown:`,
  ];

  const sorted = [...zones].sort((a, b) => b.visitors - a.visitors);
  for (const z of sorted.slice(0, 15)) {
    lines.push(`  ${z.name}: ${z.visitors} visitors, density ${z.density.toFixed(3)} p/m², capacity ${Math.round((z.visitors / z.capacity) * 100)}%, delta ${z.delta >= 0 ? '+' : ''}${z.delta}% vs plan`);
  }

  if (flowQuery) {
    lines.push('', `Flow analysis (${flowQuery.direction}):`, `  Origin: ${flowQuery.originName}, total: ${flowQuery.totalVisitors}`);
    for (const e of flowQuery.edges.slice(0, 8)) {
      lines.push(`  ${e.fromName} → ${e.toName}: ${e.visitors} (${(e.share * 100).toFixed(1)}%)`);
    }
  }

  return lines.join('\n');
}

function generateFallback(
  mallName: string,
  floor: string,
  hour: number,
  zones: ZoneInput[],
  flowQuery: NarrativeRequest['flowQuery'],
): { narrative: string; highlights: string[] } {
  const total = zones.reduce((s, z) => s + z.visitors, 0);
  const sorted = [...zones].sort((a, b) => b.visitors - a.visitors);
  const top3 = sorted.slice(0, 3);
  const floorLabel = floor === 'upper' ? 'upper floor' : 'ground floor';

  const paragraphs = [
    `At ${hour}:00, ${mallName} recorded ${total.toLocaleString()} visitors across ${zones.length} zones on the ${floorLabel}.`,
    `The busiest areas were ${top3.map(z => `${z.name} (${z.visitors} visitors)`).join(', ')}.`,
  ];

  if (flowQuery) {
    paragraphs.push(`Flow analysis shows ${flowQuery.totalVisitors.toLocaleString()} visitors in the ${flowQuery.direction} direction from ${flowQuery.originName}.`);
  }

  const highlights = [
    `Total footfall: ${total.toLocaleString()} visitors`,
    `Peak zone: ${top3[0]?.name} at ${Math.round((top3[0]?.visitors / top3[0]?.capacity) * 100)}% capacity`,
    `Average density: ${(zones.reduce((s, z) => s + z.density, 0) / zones.length).toFixed(3)} visitors/m²`,
  ];

  if (flowQuery && flowQuery.edges.length > 0) {
    highlights.push(`Top flow: ${flowQuery.edges[0].fromName} → ${flowQuery.edges[0].toName} (${flowQuery.edges[0].visitors} visitors)`);
  }

  return { narrative: paragraphs.join(' '), highlights };
}
