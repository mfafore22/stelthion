export interface ActivityAggregateItem {
  label: string;
  count: number;
}

export interface ActivityRow {
  id?: string;
  mallId: string;
  eventName: string;
  tab?: string | null;
  entityType?: string | null;
  entityLabel?: string | null;
  createdAt?: string;
}

export interface ActivityData {
  configured: boolean;
  rows: ActivityRow[];
  aggregates: {
    events: ActivityAggregateItem[];
    tabs: ActivityAggregateItem[];
    entities: ActivityAggregateItem[];
    categories: ActivityAggregateItem[];
    malls: ActivityAggregateItem[];
  };
  error?: string;
}
