import prisma from '@/app/lib/prisma';
import type { LLMMessage } from './llm-client';

export interface ChatSessionInput {
  conversationId?: string;
  mallId: string;
  userId: string;
  message: string;
}

export async function prepareChatSession(input: ChatSessionInput) {
  const conversationId = await ensureConversation(input);

  await prisma.conciergeMessage.create({
    data: {
      conversationId,
      sender: 'user',
      content: input.message,
    },
  });

  const history = await prisma.conciergeMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 40,
  });

  const messages: LLMMessage[] = history.map((m) => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  return { conversationId, messages };
}

async function ensureConversation(input: ChatSessionInput): Promise<string> {
  if (!input.conversationId) {
    const conv = await prisma.conciergeConversation.create({
      data: {
        mallId: input.mallId,
        userId: input.userId,
        title: input.message.substring(0, 60),
      },
    });
    return conv.id;
  }

  const existing = await prisma.conciergeConversation.findFirst({
    where: {
      id: input.conversationId,
      mallId: input.mallId,
      userId: input.userId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  if (!existing) throw new Error('Forbidden conversation scope');
  return input.conversationId;
}
