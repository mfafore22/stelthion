import { NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { orchestrateChat } from '@/services/concierge/context-assembler';
import type { LLMMessage } from '@/services/concierge/llm-client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { conversationId, mallId, message, language } = body as {
    conversationId?: string;
    mallId: string;
    message: string;
    language?: string;
  };

  console.log('[Concierge API] Incoming request:', { conversationId, mallId, message, language });

  if (!mallId || !message) {
    return new Response(JSON.stringify({ error: 'mallId and message required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resolve mallId against DB — legacy code uses short names like 'ideapark'
  // while the DB row is 'ideapark-lempaala'. Match exact first, then prefix.
  let resolvedMallId = mallId;
  try {
    const exact = await prisma.mall.findUnique({ where: { mallId }, select: { mallId: true } });
    if (!exact) {
      const byPrefix = await prisma.mall.findFirst({
        where: { mallId: { startsWith: mallId } },
        select: { mallId: true },
      });
      if (byPrefix) resolvedMallId = byPrefix.mallId;
    }
  } catch (lookupErr) {
    console.error('[Concierge API] Mall lookup failed', lookupErr);
  }

  // Load or create conversation
  let convId = conversationId;
  try {
    if (!convId) {
      const conv = await prisma.conciergeConversation.create({
        data: {
          mallId: resolvedMallId,
          userId: session.user.id,
          title: message.substring(0, 60),
        },
      });
      console.log(`[Concierge API] Created new conversation ${conv.id} for user ${session.user.id} in mall ${resolvedMallId}`);
      convId = conv.id;
    }

    // Save user message
    await prisma.conciergeMessage.create({
      data: {
        conversationId: convId,
        sender: 'user',
        content: message,
      },
    });
  } catch (dbError) {
    const errMsg = dbError instanceof Error ? dbError.message : 'Database error';
    console.error('[Concierge API] DB error creating conversation/message', {
      mallId,
      userId: session.user.id,
      error: errMsg,
    });
    return new Response(
      JSON.stringify({ error: `DB error: ${errMsg}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Load conversation history
  const history = await prisma.conciergeMessage.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'asc' },
    take: 40,
  });

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
          console.log('[Concierge API] Event received:', { type: event.type, dataKeys: Object.keys(event.data || {}) });

          // Forward SSE event to client
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );

          // Accumulate for DB persistence
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

        // Save agent response to DB
        if (fullContent) {
          console.log('[Concierge API] Saving agent response:', {
            conversationId: convId,
            contentLength: fullContent.length,
            agentRole,
            toolCallCount: allToolCalls.length,
            attachmentCount: allAttachments.length,
          });

          await prisma.conciergeMessage.create({
            data: {
              conversationId: convId!,
              sender: 'agent',
              content: fullContent,
              agentRole: agentRole || null,
              toolCalls: allToolCalls.length > 0 ? JSON.parse(JSON.stringify(allToolCalls)) : undefined,
              attachments: allAttachments.length > 0 ? JSON.parse(JSON.stringify(allAttachments)) : undefined,
            },
          });

          // Update conversation title if it was auto-generated
          await prisma.conciergeConversation.update({
            where: { id: convId! },
            data: { updatedAt: new Date() },
          });
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
