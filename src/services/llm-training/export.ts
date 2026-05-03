export interface TrainingPairRow {
  id: string;
  customerId: string;
  mallId: string;
  source: string;
  language: string | null;
  agentRole: string | null;
  prompt: string;
  answer: string;
  viewContext: unknown;
  toolCalls: unknown;
  attachments: unknown;
}

export function toFineTuneJsonl(row: TrainingPairRow): string {
  return JSON.stringify({
    custom_id: row.id,
    metadata: {
      customerId: row.customerId,
      mallId: row.mallId,
      source: row.source,
      language: row.language,
      agentRole: row.agentRole,
      viewContext: row.viewContext,
      toolCalls: row.toolCalls,
      attachments: row.attachments,
    },
    messages: [
      {
        role: 'system',
        content: 'You are a customer-scoped Stelthion property-management assistant. Never use data from another customer.',
      },
      { role: 'user', content: row.prompt },
      { role: 'assistant', content: row.answer },
    ],
  });
}
