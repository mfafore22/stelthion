/**
 * Context Assembler
 *
 * Orchestrates tool execution for the concierge.
 * Receives tool call requests, executes them in parallel,
 * and returns structured results + attachment metadata.
 */

import { findTool, type ToolResult } from './tools';
import { getLLMClient, type LLMMessage, type LLMToolCall } from './llm-client';
import { getPropertyPersona } from './property-persona';
import { getToolSchemas } from './tools';
import { routeToAgent } from './agent-router';
import { campaignBriefResponse } from './campaign-brief-response';
import type { AssistantViewContext } from '@/lib/assistant-flow/types';

// ── Types ─────────────────────────────────────────────────

export interface ChatRequest {
  mallId: string;
  messages: LLMMessage[];
  language?: string;
  viewContext?: AssistantViewContext | null;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: ToolResult;
  durationMs: number;
}

export interface SSEEvent {
  type: 'message_start' | 'message_chunk' | 'tool_start' | 'tool_complete' | 'message_complete' | 'error';
  data: unknown;
}

// ── Tool Execution ────────────────────────────────────────

/** Execute a batch of tool calls in parallel */
export async function executeToolCalls(
  toolCalls: LLMToolCall[],
  mallId: string,
  language?: string,
): Promise<ToolExecutionResult[]> {
  const results = await Promise.all(
    toolCalls.map(async (call) => {
      const start = Date.now();
      const tool = findTool(call.name);

      if (!tool) {
        return {
          toolCallId: call.id,
          toolName: call.name,
          result: { text: `Unknown tool: ${call.name}` },
          durationMs: Date.now() - start,
        };
      }

      try {
        const result = await tool.execute(call.arguments, mallId, language);
        return {
          toolCallId: call.id,
          toolName: call.name,
          result,
          durationMs: Date.now() - start,
        };
      } catch (error) {
        return {
          toolCallId: call.id,
          toolName: call.name,
          result: { text: `Tool error: ${error instanceof Error ? error.message : 'Unknown error'}` },
          durationMs: Date.now() - start,
        };
      }
    })
  );

  return results;
}

// ── Chat Orchestration ────────────────────────────────────

/**
 * Run the full chat pipeline:
 * 1. Build system prompt
 * 2. Detect specialist via agent-router
 * 3. Call LLM with tools
 * 4. If LLM requests tool calls, execute them and re-call
 * 5. Yield SSE events throughout
 *
 * Max 3 tool-call rounds to prevent infinite loops.
 */
export async function* orchestrateChat(
  request: ChatRequest
): AsyncGenerator<SSEEvent> {
  const { mallId, messages, language, viewContext } = request;
  const persona = getPropertyPersona(mallId);
  const toolSchemas = getToolSchemas();
  const client = getLLMClient();

  // Detect specialist from the last user message
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  let agentRole: string | undefined;
  if (lastUserMsg) {
    const routing = routeToAgent(lastUserMsg.content);
    agentRole = routing.agentRole;
  }
  const directCampaignResponse = campaignBriefResponse(messages, viewContext, language);
  if (directCampaignResponse) agentRole = 'event-coordinator';

  const viewContextBlock = renderViewContextBlock(viewContext);
  const systemPrompt = viewContextBlock
    ? `${persona.systemPrompt}\n\n${viewContextBlock}`
    : persona.systemPrompt;

  // Build full message list with system prompt
  const fullMessages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...trimConversationHistory(messages, 20),
  ];

  yield {
    type: 'message_start',
    data: { agentRole, mallId },
  };

  if (directCampaignResponse) {
    for (const chunk of chunkText(directCampaignResponse)) {
      yield { type: 'message_chunk', data: { text: chunk } };
    }
    yield {
      type: 'message_complete',
      data: { content: directCampaignResponse, agentRole },
    };
    return;
  }

  // Track tool calls across rounds to avoid duplicate execution / attachment spam
  const executedToolKeys = new Set<string>();
  let lastFallbackText = '';

  // Tool-call loop (max 3 rounds)
  for (let round = 0; round < 3; round++) {
    let accumulatedText = '';
    let pendingToolCalls: LLMToolCall[] = [];
    let isDone = false;

    for await (const chunk of client.chat(fullMessages, toolSchemas)) {
      switch (chunk.type) {
        case 'text':
          accumulatedText += chunk.text || '';
          yield { type: 'message_chunk', data: { text: chunk.text } };
          break;

        case 'tool_calls':
          pendingToolCalls = chunk.toolCalls || [];
          break;

        case 'done':
          isDone = true;
          break;

        case 'error':
          yield { type: 'error', data: { error: chunk.error } };
          return;
      }
    }

    // Filter out any tool calls we've already executed this turn
    const newToolCalls = pendingToolCalls.filter((call) => {
      const key = `${call.name}:${stableArgsKey(call.arguments)}`;
      if (executedToolKeys.has(key)) return false;
      executedToolKeys.add(key);
      return true;
    });

    // If no *new* tool calls, finish with whatever we have
    if (newToolCalls.length === 0 || isDone) {
      yield {
        type: 'message_complete',
        data: {
          content: accumulatedText || lastFallbackText,
          agentRole,
        },
      };
      return;
    }

    // Refine agent role based on what tools actually got called
    agentRole = agentRoleForTools(newToolCalls.map((c) => c.name)) ?? agentRole;

    // Execute tool calls
    for (const call of newToolCalls) {
      yield {
        type: 'tool_start',
        data: { toolCallId: call.id, toolName: call.name, params: call.arguments },
      };
    }

    const toolResults = await executeToolCalls(newToolCalls, mallId, language);

    for (const result of toolResults) {
      yield {
        type: 'tool_complete',
        data: {
          toolCallId: result.toolCallId,
          toolName: result.toolName,
          text: result.result.text,
          attachment: result.result.attachment || null,
          durationMs: result.durationMs,
        },
      };

      // Add tool result back to messages for next LLM round
      fullMessages.push({
        role: 'assistant',
        content: accumulatedText || `Calling ${result.toolName}...`,
      });
      fullMessages.push({
        role: 'tool',
        content: result.result.text,
        toolCallId: result.toolCallId,
        name: result.toolName,
      });
    }

    // Localised fallback so we don't end up with English summary text on FI users
    lastFallbackText = fallbackSummary(language, toolResults.map((r) => r.toolName));

    accumulatedText = '';
  }

  // If we exceeded max rounds
  yield {
    type: 'message_complete',
    data: {
      content: lastFallbackText || fallbackSummary(language, []),
      agentRole,
    },
  };
}

// ── View context ──────────────────────────────────────────

function renderViewContextBlock(
  viewContext: AssistantViewContext | null | undefined,
): string | null {
  if (!viewContext) return null;
  if (viewContext.kind === 'shoppermind_trend') {
    return [
      'CURRENT VIEWING CONTEXT',
      'The user is currently looking at a ShopperMind trend:',
      `- Label: ${viewContext.label}`,
      `- State: ${viewContext.state}`,
      `- Primary country: ${viewContext.primaryCountry}`,
      `- Phenomenon ID: ${viewContext.phenomenonId}`,
      '',
      'When the user asks open-ended questions ("ideas?", "what should I do?",',
      '"miten hyödyntäisin tätä?"), assume they mean this trend unless they say',
      'otherwise. Prefer the generate_campaign_idea tool for concrete proposals;',
      'pass this phenomenonId. Keep responses in the user\'s language.',
    ].join('\n');
  }
  if (viewContext.kind === 'campaign_brief') {
    const labels = viewContext.payload?.labels as Record<string, string> | undefined;
    const metrics = viewContext.payload?.metrics as Record<string, { value?: string; hint?: string }> | undefined;
    const draft = viewContext.payload?.draft as {
      tenantRoles?: Array<{ name?: string; location?: string; role?: string }>;
      liveConnectors?: string[];
      learningCapture?: string[];
    } | null | undefined;
    const workflow = viewContext.payload?.workflow as { steps?: Array<{ title?: string; body?: string; demoContent?: string }> } | undefined;
    const steps = workflow?.steps?.map((step) => `${step.title}: ${step.body}${step.demoContent ? ` ${step.demoContent}` : ''}`);
    return [
      'CURRENT WORK CONTEXT',
      'The user is creating a campaign brief from the Campaigns workspace.',
      labels?.mall ? `- Property: ${labels.mall}` : null,
      labels?.zone ? `- Zone: ${labels.zone}` : null,
      labels?.audience ? `- Audience: ${labels.audience}` : null,
      labels?.category ? `- Tenant category: ${labels.category}` : null,
      labels?.stores ? `- Suggested tenant participants: ${labels.stores}` : null,
      labels?.budget ? `- Budget: ${labels.budget}` : null,
      labels?.duration ? `- Duration: ${labels.duration}` : null,
      labels?.impact ? `- ShopperMind tenant-impact source: ${labels.impact}` : null,
      metrics?.visits?.value ? `- Visitor estimate: ${metrics.visits.value} (${metrics.visits.hint ?? 'demo model'})` : null,
      metrics?.sales?.value ? `- Sales signal: ${metrics.sales.value} (${metrics.sales.hint ?? 'demo model'})` : null,
      metrics?.tenants?.value ? `- Tenant count: ${metrics.tenants.value} (${metrics.tenants.hint ?? 'demo model'})` : null,
      draft?.tenantRoles?.length ? `- Tenant roles: ${draft.tenantRoles.map((tenant) => `${tenant.name} (${tenant.location}): ${tenant.role}`).join(' | ')}` : null,
      steps?.length ? `- Workflow: ${steps.join(' | ')}` : null,
      draft?.liveConnectors?.length ? `- Live data connectors: ${draft.liveConnectors.join(', ')}` : null,
      draft?.learningCapture?.length ? `- Learning capture fields: ${draft.learningCapture.join(', ')}` : null,
      '',
      'Use these selected settings to draft a practical campaign brief. Do not ask the user to re-select them.',
      'Answer as a campaign designer: include objective, customer need, tenant role, channel mix, activation concept, KPI plan, approval steps, and what data should be connected later.',
      'Do not answer with unrelated demographics, events, or generic property information unless it directly supports this campaign brief.',
    ].filter(Boolean).join('\n');
  }
  const payload = 'payload' in viewContext && viewContext.payload
    ? `- Payload: ${JSON.stringify(viewContext.payload).slice(0, 1200)}`
    : null;
  return [
    'CURRENT WORK CONTEXT',
    `- Kind: ${viewContext.kind}`,
    `- Label: ${viewContext.label}`,
    'source' in viewContext ? `- Source module: ${viewContext.source}` : null,
    viewContext.returnTarget ? `- Return target: ${viewContext.returnTarget.label} (${viewContext.returnTarget.href})` : null,
    payload,
    '',
    'Use this context when the user asks follow-up questions. Keep customer data isolated and never infer data from another customer.',
  ].filter(Boolean).join('\n');
}

// ── Tool/agent helpers ────────────────────────────────────

function stableArgsKey(args: unknown): string {
  try {
    return JSON.stringify(args, Object.keys((args as Record<string, unknown>) ?? {}).sort());
  } catch {
    return String(args);
  }
}

function chunkText(text: string) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 180) chunks.push(text.slice(i, i + 180));
  return chunks;
}

/** Map the dominant tool name to a display agent role. */
function agentRoleForTools(toolNames: string[]): string | undefined {
  if (toolNames.length === 0) return undefined;
  const first = toolNames[0];
  if (first.includes('weather')) return 'general-assistant';
  if (first.includes('transport')) return 'general-assistant';
  if (first.includes('footfall') || first.includes('zone_flow') || first.includes('zone_info')) return 'footfall-analyst';
  if (first.includes('parking')) return 'parking-manager';
  if (first.includes('event')) return 'event-coordinator';
  if (first.includes('trend') || first.includes('shoppermind')) return 'trend-analyst';
  if (first.includes('mall_stats') || first.includes('demographics') || first.includes('store_info')) return 'general-assistant';
  return undefined;
}

const TOOL_FRIENDLY_NAMES: Record<string, { fi: string; sv: string; en: string }> = {
  get_current_weather: { fi: 'sää', sv: 'väder', en: 'weather' },
  get_weather_forecast: { fi: 'sääennuste', sv: 'väderprognos', en: 'weather forecast' },
  get_footfall_profile: { fi: 'kävijäprofiili', sv: 'besöksprofil', en: 'footfall profile' },
  get_footfall_for_date: { fi: 'kävijämäärät', sv: 'besöksantal', en: 'footfall' },
  get_events: { fi: 'tapahtumat', sv: 'evenemang', en: 'events' },
  get_parking_status: { fi: 'pysäköinti', sv: 'parkering', en: 'parking' },
  get_transport: { fi: 'joukkoliikenne', sv: 'kollektivtrafik', en: 'public transport' },
  get_demographics: { fi: 'demografia', sv: 'demografi', en: 'demographics' },
  get_mall_stats: { fi: 'kauppakeskustiedot', sv: 'köpcentrumstatistik', en: 'mall stats' },
  get_zone_info: { fi: 'aluetiedot', sv: 'zoninformation', en: 'zone info' },
  get_store_info: { fi: 'myymälätiedot', sv: 'butiksinformation', en: 'store info' },
  get_zone_flow: { fi: 'kävijävirta', sv: 'besökarflöde', en: 'zone flow' },
  get_shoppermind_trends: { fi: 'trendit', sv: 'trender', en: 'trends' },
};

function friendlyToolNames(toolNames: string[], lang: 'fi' | 'sv' | 'en'): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of toolNames) {
    const friendly = TOOL_FRIENDLY_NAMES[name]?.[lang] ?? name.replace(/^get_/, '').replace(/_/g, ' ');
    if (!seen.has(friendly)) {
      seen.add(friendly);
      out.push(friendly);
    }
  }
  return out;
}

function joinList(items: string[], lang: 'fi' | 'sv' | 'en'): string {
  if (items.length <= 1) return items.join('');
  const last = items[items.length - 1];
  const head = items.slice(0, -1).join(', ');
  const conj = lang === 'fi' ? ' ja ' : lang === 'sv' ? ' och ' : ' and ';
  return head + conj + last;
}

function fallbackSummary(language: string | undefined, toolNames: string[]): string {
  const code = (language ?? 'en').toLowerCase();
  const lang: 'fi' | 'sv' | 'en' = code.startsWith('fi') ? 'fi' : code.startsWith('sv') ? 'sv' : 'en';
  const friendly = friendlyToolNames(toolNames, lang);
  const summary = joinList(friendly, lang);

  if (lang === 'fi') {
    return summary
      ? `Hain tiedot: ${summary}. Tulokset alla.`
      : 'Tässä kokoamani tiedot.';
  }
  if (lang === 'sv') {
    return summary
      ? `Hämtade data: ${summary}. Resultaten nedan.`
      : 'Här är den information jag samlade in.';
  }
  return summary
    ? `Fetched data: ${summary}. Results below.`
    : 'Here is what I found.';
}

// ── Helpers ───────────────────────────────────────────────

/** Keep only the last N messages to stay within context limits */
function trimConversationHistory(messages: LLMMessage[], maxMessages: number): LLMMessage[] {
  if (messages.length <= maxMessages) return messages;

  // Always keep the first message (if it's a greeting) and the last N-1
  return [
    messages[0],
    ...messages.slice(-(maxMessages - 1)),
  ];
}
