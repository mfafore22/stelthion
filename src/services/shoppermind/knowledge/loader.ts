/**
 * ShopperMind knowledge-base loader.
 *
 * Reads curated Markdown baselines (forecasts, scenario priors, historical
 * context) from this directory and exposes them as structured `KnowledgeDoc`
 * records. Intended consumer: `generateNarrative()` in prompts.ts, which will
 * RAG over matching docs to ground daily Signal-of-the-Day briefings.
 *
 * Not wired into the pipeline yet — the local LLM is still a stub. Once
 * LOCAL_LLM_URL is configured, pass `findRelevantKnowledge(country, categories)`
 * into the narrative prompt as system context.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface KnowledgeDoc {
  id: string;
  path: string;
  country: string;
  topic: string;
  timeframe?: string;
  type?: string;
  categories: string[];
  confidence?: 'low' | 'medium' | 'high';
  compiledAt?: string;
  sources: string[];
  summary?: string;
  body: string;
}

const KNOWLEDGE_DIR = resolveKnowledgeDir();
let cache: KnowledgeDoc[] | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60_000;

export async function loadKnowledge(opts?: { force?: boolean }): Promise<KnowledgeDoc[]> {
  const now = Date.now();
  if (!opts?.force && cache && now - cacheLoadedAt < CACHE_TTL_MS) return cache;

  let entries: string[];
  try {
    entries = await readdir(KNOWLEDGE_DIR);
  } catch {
    cache = [];
    cacheLoadedAt = now;
    return cache;
  }

  const docs: KnowledgeDoc[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const fullPath = join(KNOWLEDGE_DIR, entry);
    try {
      const raw = await readFile(fullPath, 'utf-8');
      const parsed = parseDoc(raw, fullPath, entry);
      if (parsed) docs.push(parsed);
    } catch (err) {
      console.warn(`[knowledge] failed to load ${entry}:`, err instanceof Error ? err.message : err);
    }
  }

  cache = docs;
  cacheLoadedAt = now;
  return cache;
}

/**
 * Return docs matching country and (optionally) any of the supplied categories.
 * GLOBAL-country docs always pass the country filter.
 */
export async function findRelevantKnowledge(
  country: string,
  categories: string[] = [],
): Promise<KnowledgeDoc[]> {
  const all = await loadKnowledge();
  return all.filter((doc) => {
    if (doc.country !== country && doc.country !== 'GLOBAL') return false;
    if (categories.length === 0) return true;
    if (doc.categories.length === 0) return true;
    return categories.some((c) => doc.categories.includes(c));
  });
}

/**
 * Compact system-prompt block suitable for prepending to LLM calls.
 * Includes summary + body for each matching doc.
 */
export function buildKnowledgeContext(docs: KnowledgeDoc[], maxChars = 6000): string {
  if (docs.length === 0) return '';
  const lines: string[] = ['## Background baselines (curated)'];
  let used = lines[0].length;
  for (const doc of docs) {
    const block = `\n### ${doc.topic} (${doc.country}${doc.timeframe ? ', ' + doc.timeframe : ''})\n${doc.summary ?? ''}\n\n${doc.body}`;
    if (used + block.length > maxChars) {
      lines.push(`\n_(…${docs.length - lines.length + 1} more baseline(s) omitted for length)_`);
      break;
    }
    lines.push(block);
    used += block.length;
  }
  return lines.join('\n');
}

// ── Parsing ────────────────────────────────────────────────────────────────

function parseDoc(raw: string, path: string, filename: string): KnowledgeDoc | null {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;
  const fm = parseFrontmatter(match[1]);
  const body = match[2].trim();

  if (!fm.country || !fm.topic) return null;

  return {
    id: String(fm.id ?? filename.replace(/\.md$/, '')),
    path,
    country: String(fm.country),
    topic: String(fm.topic),
    timeframe: fm.timeframe ? String(fm.timeframe) : undefined,
    type: fm.type ? String(fm.type) : undefined,
    categories: asStringArray(fm.categories),
    confidence: fm.confidence as KnowledgeDoc['confidence'],
    compiledAt: fm.compiledAt ? String(fm.compiledAt) : undefined,
    sources: asStringArray(fm.sources),
    summary: fm.summary ? String(fm.summary) : undefined,
    body,
  };
}

/**
 * Minimal YAML-frontmatter parser for our controlled schema — supports:
 *   key: scalar
 *   key: [a, b, c]
 *   key:
 *     - a
 *     - b
 *   key: >
 *     folded scalar continued
 *     across lines
 */
function parseFrontmatter(src: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const lines = src.split(/\r?\n/);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    const rest = m[2];

    if (rest === '>' || rest === '|') {
      const folded: string[] = [];
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) {
        folded.push(lines[i].trim());
        i++;
      }
      out[key] = folded.join(rest === '>' ? ' ' : '\n');
      continue;
    }

    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1).trim();
      out[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        : [];
      i++;
      continue;
    }

    if (rest === '') {
      const items: string[] = [];
      i++;
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s/, '').trim().replace(/^['"]|['"]$/g, ''));
        i++;
      }
      out[key] = items;
      continue;
    }

    out[key] = rest.trim().replace(/^['"]|['"]$/g, '');
    i++;
  }

  return out;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function resolveKnowledgeDir(): string {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return join(process.cwd(), 'src/services/shoppermind/knowledge');
  }
}
