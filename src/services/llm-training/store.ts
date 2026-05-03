import prisma from '@/app/lib/prisma';

export const TRAINING_PAIR_TARGET = 5000;

type TrainingPairDelegate = {
  count: (args: { where: { customerId: string } }) => Promise<number>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
};

export interface TrainingPairInput {
  customerId: string;
  mallId: string;
  conversationId?: string | null;
  source: string;
  language?: string | null;
  agentRole?: string | null;
  prompt: string;
  answer: string;
  viewContext?: unknown;
  toolCalls?: unknown[];
  attachments?: unknown[];
}

function hasContent(prompt: string, answer: string): boolean {
  return prompt.trim().length > 0 && answer.trim().length > 0;
}

export async function recordTrainingPair(input: TrainingPairInput): Promise<void> {
  if (!hasContent(input.prompt, input.answer)) return;

  try {
    const delegate = (prisma as unknown as { llmTrainingPair?: TrainingPairDelegate }).llmTrainingPair;
    if (!delegate) {
      console.warn('[llm-training] LlmTrainingPair delegate is unavailable. Run prisma generate/migrate.');
      return;
    }

    const count = await delegate.count({
      where: { customerId: input.customerId },
    });
    if (count >= TRAINING_PAIR_TARGET) return;

    await delegate.create({
      data: {
        customerId: input.customerId,
        mallId: input.mallId,
        conversationId: input.conversationId ?? null,
        source: input.source,
        language: input.language ?? null,
        agentRole: input.agentRole ?? null,
        prompt: input.prompt,
        answer: input.answer,
        viewContext: input.viewContext == null ? undefined : JSON.parse(JSON.stringify(input.viewContext)),
        toolCalls: input.toolCalls?.length ? JSON.parse(JSON.stringify(input.toolCalls)) : undefined,
        attachments: input.attachments?.length ? JSON.parse(JSON.stringify(input.attachments)) : undefined,
      },
    });
  } catch (error) {
    console.warn('[llm-training] Failed to record training pair', error);
  }
}
