import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { orchestrateChat } from '@/services/concierge/context-assembler';
import { HttpError } from '@/server/api/define-handler';
import * as mallRepo from '@/server/repositories/mall';
import * as conciergeRepo from '@/server/repositories/concierge';
import type { LLMMessage } from '@/services/concierge/llm-client';

function jsonErr(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return jsonErr('Unauthorized', 401);

  const body = await req.json();
  const { conversationId, mallId, message, language } = body as {
    conversationId?: string;
    mallId: string;
    message: string;
    language?: string;
  };

  if (!mallId || !message) return jsonErr('mallId and message required', 400);

  // Resolve mallId against DB — legacy code uses short names like 'ideapark'
  // while the DB row is 'ideapark-lempaala'. Match exact first, then prefix.
  let resolvedMallId = mallId;
  try {
    const resolved = await mallRepo.resolveMallIdUnscoped(mallId);
    if (resolved) resolvedMallId = resolved;
  } catch (lookupErr) {
    console.error('[Concierge API] Mall lookup failed', lookupErr);
  }

  // Ownership guard: verify caller owns the resolved mall BEFORE any LLM cost is incurred.
  try {
    await mallRepo.assertOwnership(session, resolvedMallId);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  // If resuming an existing conversation, verify the caller owns it.
  if (conversationId) {
    try {
      await conciergeRepo.assertConversationOwnership(session, conversationId);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      throw err;
    }
  }

  // Load or create conversation
  let convId = conversationId;
  try {
    if (!convId) {
      const conv = await conciergeRepo.createConversationForCaller(
        session,
        resolvedMallId,
        message.substring(0, 60),
      );
      convId = conv.id;
    }

    // Save user message
    await conciergeRepo.appendMessageForCaller(session, convId, {
      sender: 'user',
      content: message,
    });
  } catch (dbError) {
    const errMsg = dbError instanceof Error ? dbError.message : 'Database error';
    console.error('[Concierge API] DB error creating conversation/message', {
      mallId,
      userId: session.user.id,
      error: errMsg,
    });
    return jsonErr(`DB error: ${errMsg}`, 500);
  }

  // Load conversation history
  const history = await conciergeRepo.listMessagesForCaller(session, convId!);

  const messages: LLMMessage[] = history.map(m => ({
    role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
    content: m.content,
  }));

  console.log('[Concierge API] Conversation history loaded:', {
    conversationId: convId,
    messageCount: messages.length,
    messages: messages.map(m => ({ role: m.role, contentLength: m.content.length })),
  });

  // Stream response via SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';
      let agentRole: string | undefined;
      const allAttachments: unknown[] = [];
      const allToolCalls: unknown[] = [];

      try {
        // Send conversationId first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'conversation', data: { conversationId: convId } })}\n\n`)
        );

        for await (const event of orchestrateChat({ mallId: resolvedMallId, messages, language })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );

          switch (event.type) {
            case 'message_start':
              agentRole = (event.data as { agentRole?: string }).agentRole;
              break;
            case 'message_chunk':
              fullContent += (event.data as { text?: string }).text || '';
              break;
            case 'tool_complete': {
              const tc = event.data as { toolName: string; attachment?: unknown };
              allToolCalls.push(event.data);
              if (tc.attachment) allAttachments.push(tc.attachment);
              break;
            }
            case 'message_complete':
              fullContent = (event.data as { content?: string }).content || fullContent;
              break;
          }
        }

        if (fullContent) {
          await conciergeRepo.appendMessageForCaller(session, convId!, {
            sender: 'agent',
            content: fullContent,
            agentRole: agentRole || null,
            toolCalls: allToolCalls.length > 0 ? JSON.parse(JSON.stringify(allToolCalls)) : undefined,
            attachments: allAttachments.length > 0 ? JSON.parse(JSON.stringify(allAttachments)) : undefined,
          });

          await conciergeRepo.touchConversationForCaller(session, convId!);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Concierge API] Streaming error:', { error: errMsg, stack: error instanceof Error ? error.stack : undefined });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', data: { error: errMsg } })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
    },
  });
}
