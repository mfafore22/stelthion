import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { resolveScopedMall } from '@/lib/customer-scope/requireMallScope';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mallId = new URL(req.url).searchParams.get('mallId');
  if (!mallId) return NextResponse.json({ error: 'mallId required' }, { status: 400 });

  const scope = await resolveScopedMall(mallId);
  if (scope.error) return scope.error;

  const rows = await prisma.conciergeConversation.findMany({
    where: {
      mallId: scope.mall!.mallId,
      userId: session.user.id,
      status: 'ACTIVE',
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, toolCalls: true, agentRole: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(rows.map((row) => ({
    id: row.id,
    title: row.title,
    agentRole: row.messages[0]?.agentRole ?? 'general-assistant',
    preview: row.messages[0]?.content ?? '',
    messageCount: row._count.messages,
    toolsUsed: Array.isArray(row.messages[0]?.toolCalls) ? row.messages[0].toolCalls.length : 0,
    lastMessageAt: row.updatedAt,
    createdAt: row.createdAt,
  })));
}
