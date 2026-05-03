import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { resolveScopedMall } from '@/lib/customer-scope/requireMallScope';
import { prepareChatSession } from '@/services/concierge/chat-session';
import { createConciergeStream } from '@/services/concierge/chat-stream';
import type { AssistantViewContext } from '@/lib/assistant-flow/types';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { conversationId, mallId, message, language, viewContext } = body as {
    conversationId?: string;
    mallId: string;
    message: string;
    language?: string;
    viewContext?: AssistantViewContext | null;
  };

  if (!mallId || !message) {
    return new Response(JSON.stringify({ error: 'mallId and message required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scope = await resolveScopedMall(mallId);
  if (scope.error) return scope.error;
  const resolvedMallId = scope.mall!.mallId;
  const resolvedCustomerId = scope.mall!.customerId;

  let chat;
  try {
    chat = await prepareChatSession({
      conversationId,
      mallId: resolvedMallId,
      userId: session.user.id,
      message,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Database error';
    const status = errMsg === 'Forbidden conversation scope' ? 403 : 500;
    return new Response(JSON.stringify({ error: errMsg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = createConciergeStream({
    conversationId: chat.conversationId,
    customerId: resolvedCustomerId,
    mallId: resolvedMallId,
    prompt: message,
    messages: chat.messages,
    language,
    viewContext: viewContext ?? null,
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
    },
  });
}
