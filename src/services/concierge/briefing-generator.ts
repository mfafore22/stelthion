/**
 * Briefing Generator
 *
 * Aggregates data from all sources into a structured daily briefing.
 * Called by the cron endpoint or on-demand from the briefing API.
 */

import { findTool } from './tools';

export interface BriefingSection {
  key: string;
  title: string;
  content: string;
  data?: unknown;
}

export interface BriefingData {
  mallId: string;
  date: string;
  sections: BriefingSection[];
  generatedAt: string;
}

/**
 * Generate a daily briefing by calling concierge tools.
 */
export async function generateBriefing(
  mallId: string,
  sectionKeys: string[] = ['weather', 'footfall', 'events', 'transport']
): Promise<BriefingData> {
  const sections: BriefingSection[] = [];
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const weekday = today.getDay();

  // Run all tool calls in parallel
  const tasks: Promise<void>[] = [];

  if (sectionKeys.includes('weather')) {
    tasks.push(
      (async () => {
        const weatherTool = findTool('get_current_weather');
        if (!weatherTool) return;
        const result = await weatherTool.execute({}, mallId);
        sections.push({
          key: 'weather',
          title: 'Weather',
          content: result.text,
          data: result.attachment?.data,
        });
      })()
    );
  }

  if (sectionKeys.includes('footfall')) {
    tasks.push(
      (async () => {
        const footfallTool = findTool('get_footfall_profile');
        if (!footfallTool) return;
        const result = await footfallTool.execute({ weekday }, mallId);
        sections.push({
          key: 'footfall',
          title: 'Expected Footfall',
          content: result.text,
          data: result.attachment?.data,
        });
      })()
    );
  }

  if (sectionKeys.includes('events')) {
    tasks.push(
      (async () => {
        const eventsTool = findTool('get_events');
        if (!eventsTool) return;
        const result = await eventsTool.execute({}, mallId);
        sections.push({
          key: 'events',
          title: 'Upcoming Events',
          content: result.text,
          data: result.attachment?.data,
        });
      })()
    );
  }

  if (sectionKeys.includes('transport')) {
    tasks.push(
      (async () => {
        const transportTool = findTool('get_transport');
        if (!transportTool) return;
        const result = await transportTool.execute({}, mallId);
        sections.push({
          key: 'transport',
          title: 'Transport',
          content: result.text,
          data: result.attachment?.data,
        });
      })()
    );
  }

  await Promise.all(tasks);

  // Sort sections in the order they were requested
  sections.sort((a, b) => sectionKeys.indexOf(a.key) - sectionKeys.indexOf(b.key));

  return {
    mallId,
    date: dateStr,
    sections,
    generatedAt: new Date().toISOString(),
  };
}
