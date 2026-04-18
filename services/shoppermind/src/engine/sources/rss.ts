import type { FetchResult, SourceFetcher, RawSignalInput } from '../types.js';
import { normaliseSignal } from '../normaliser.js';

const MAX_ITEMS_PER_RUN = 50;
const FETCH_TIMEOUT_MS = 15000;

export const fetchRss: SourceFetcher = async (ctx): Promise<FetchResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(ctx.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ShopperMind/1.0 (+signal-ingestion)' },
    });
    if (!res.ok) {
      return { signals: [], errorMsg: `HTTP ${res.status}` };
    }
    const xml = await res.text();
    const items = parseFeed(xml).slice(0, MAX_ITEMS_PER_RUN);
    const signals: RawSignalInput[] = items.map((it) =>
      normaliseSignal({
        externalId: it.guid || it.link || it.title,
        title: it.title,
        summary: it.description,
        url: it.link,
        country: ctx.country,
        language: ctx.language,
        publishedAt: it.pubDate ?? new Date(),
        metadata: { source: ctx.name },
      }),
    );
    return { signals };
  } catch (err) {
    return { signals: [], errorMsg: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeout);
  }
};

interface FeedItem {
  title: string;
  link?: string;
  guid?: string;
  description?: string;
  pubDate?: Date;
}

function parseFeed(xml: string): FeedItem[] {
  const isAtom = /<feed[\s>]/.test(xml) && !/<rss[\s>]/.test(xml);
  return isAtom ? parseAtom(xml) : parseRss(xml);
}

function parseRss(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml))) {
    const block = m[1];
    const title = extractTag(block, 'title');
    if (!title) continue;
    const link = extractTag(block, 'link');
    const guid = extractTag(block, 'guid');
    const description = extractTag(block, 'description');
    const pubDateRaw = extractTag(block, 'pubDate');
    items.push({
      title,
      link,
      guid,
      description,
      pubDate: pubDateRaw ? new Date(pubDateRaw) : undefined,
    });
  }
  return items;
}

function parseAtom(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRegex.exec(xml))) {
    const block = m[1];
    const title = extractTag(block, 'title');
    if (!title) continue;
    const id = extractTag(block, 'id');
    const summary = extractTag(block, 'summary') || extractTag(block, 'content');
    const updated = extractTag(block, 'updated') || extractTag(block, 'published');
    const linkMatch = /<link\b[^>]*href="([^"]+)"/i.exec(block);
    items.push({
      title,
      link: linkMatch?.[1],
      guid: id,
      description: summary,
      pubDate: updated ? new Date(updated) : undefined,
    });
  }
  return items;
}

function extractTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(block);
  if (!m) return undefined;
  return stripCdata(m[1]).trim() || undefined;
}

function stripCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
