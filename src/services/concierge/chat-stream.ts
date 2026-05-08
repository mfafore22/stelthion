import prisma from '@/app/lib/prisma';
import { recordTrainingPair } from '@/services/llm-training/store';
import { orchestrateChat } from './context-assembler';
import type { LLMMessage } from './llm-client';
import type { AssistantViewContext } from '@/lib/assistant-flow/types';

export interface ConciergeStreamInput {
  conversationId: string;
  customerId: string;
  mallId: string;
  prompt: string;
  messages: LLMMessage[];
  language?: string;
  viewContext?: AssistantViewContext | null;
}

export function createConciergeStream(input: ConciergeStreamInput): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const state = streamState();
      try {
        emit(controller, encoder, 'conversation', { conversationId: input.conversationId });
        for await (const event of orchestrateChat({
          mallId: input.mallId,
          messages: input.messages,
          language: input.language,
          viewContext: input.viewContext ?? null,
        })) {
          emitRaw(controller, encoder, event);
          collectEvent(state, event);
        }
        if (state.fullContent) await persistAssistantTurn(input, state);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        emit(controller, encoder, 'error', { error: message });
      } finally {
        controller.close();
      }
    },
  });
}

function streamState() {
  return {
    fullContent: '',
    agentRole: undefined as string | undefined,
    attachments: [] as unknown[],
    toolCalls: [] as unknown[],
  };
}

function collectEvent(state: ReturnType<typeof streamState>, event: { type: string; data: unknown }) {
  if (event.type === 'message_start') state.agentRole = (event.data as { agentRole?: string }).agentRole;
  if (event.type === 'message_chunk') state.fullContent += (event.data as { text?: string }).text || '';
  if (event.type === 'message_complete') state.fullContent = (event.data as { content?: string }).content || state.fullContent;
  if (event.type === 'tool_complete') {
    const tool = event.data as { attachment?: unknown };
    state.toolCalls.push(event.data);
    if (tool.attachment) state.attachments.push(tool.attachment);
  }
}

async function persistAssistantTurn(input: ConciergeStreamInput, state: ReturnType<typeof streamState>) {
  await prisma.conciergeMessage.create({
    data: {
      conversationId: input.conversationId,
      sender: 'agent',
      content: state.fullContent,
      agentRole: state.agentRole || null,
      toolCalls: state.toolCalls.length ? JSON.parse(JSON.stringify(state.toolCalls)) : undefined,
      attachments: state.attachments.length ? JSON.parse(JSON.stringify(state.attachments)) : undefined,
    },
  });
  await prisma.conciergeConversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });
  await recordTrainingPair({
    customerId: input.customerId,
    mallId: input.mallId,
    conversationId: input.conversationId,
    source: 'concierge.chat',
    language: input.language,
    agentRole: state.agentRole,
    prompt: input.prompt,
    answer: state.fullContent,
    viewContext: input.viewContext ?? null,
    toolCalls: state.toolCalls,
    attachments: state.attachments,
  });
}

function emit(controller: ReadableStreamDefaultController, encoder: TextEncoder, type: string, data: unknown) {
  emitRaw(controller, encoder, { type, data });
}

function emitRaw(controller: ReadableStreamDefaultController, encoder: TextEncoder, event: unknown) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}
