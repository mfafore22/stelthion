export interface FeedbackRow {
  id: string;
  phenomenonId: string;
  phenomenonLabel: string;
  userId: string;
  marketId: string | null;
  interactionKind: string;
  verdict: string;
  note: string | null;
  createdAt: string;
}

export interface FeedbackAggregate {
  phenomenonId: string;
  phenomenonLabel: string;
  relevant: number;
  notRelevant: number;
  commentCount: number;
}

export interface FeedbackListData {
  configured: boolean;
  rows: FeedbackRow[];
  aggregates: FeedbackAggregate[];
  error?: string;
}

export type VerdictFilter = 'all' | 'relevant' | 'not_relevant';
export type DaysFilter = 7 | 30 | 90 | 365;
