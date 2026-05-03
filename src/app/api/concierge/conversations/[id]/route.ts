import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/auth';
import { currentUserMallIds } from '@/lib/admin-customer';

async function allowedMallIds() {
  const ids = await currentUserMallIds();
  return ids ?? [];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const mallIds = await allowedMallIds();
  const conversation = await prisma.conciergeConversation.findFirst({
    where: { id, userId: session.user.id, mallId: { in: mallIds }, status: 'ACTIVE' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ...conversation,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      createdAt: m.createdAt,
      agentRole: m.agentRole,
      toolCalls: m.toolCalls,
      attachments: m.attachments,
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const mallIds = await allowedMallIds();
  const existing = await prisma.conciergeConversation.findFirst({
    where: { id, userId: session.user.id, mallId: { in: mallIds } },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.conciergeConversation.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });
  return NextResponse.json({ ok: true });
}
