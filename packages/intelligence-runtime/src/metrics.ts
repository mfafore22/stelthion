export type MetricKind = 'counter' | 'gauge' | 'timing';

export interface MetricPoint {
  name: string;
  kind: MetricKind;
  value: number;
  tags?: Record<string, string>;
  observedAt: string;
}

export interface MetricSummary {
  name: string;
  kind: MetricKind;
  count: number;
  sum: number;
  min: number;
  max: number;
  latest: number;
}

export interface MetricRatio {
  numerator: number;
  denominator: number;
  ratio: number | null;
}

export interface MetricsPort {
  record(point: MetricPoint): void;
  snapshot(name?: string): MetricSummary[];
  clear(): void;
}

export class InMemoryMetricsPort implements MetricsPort {
  private points: MetricPoint[] = [];

  record(point: MetricPoint): void {
    this.points.push({ ...point, tags: point.tags ? { ...point.tags } : undefined });
  }

  snapshot(name?: string): MetricSummary[] {
    const groups = new Map<string, MetricPoint[]>();
    for (const point of this.points) {
      if (name && point.name !== name) continue;
      const key = `${point.kind}:${point.name}`;
      groups.set(key, [...(groups.get(key) ?? []), point]);
    }
    return Array.from(groups.values()).map(summarize);
  }

  clear(): void {
    this.points = [];
  }
}

export function counter(name: string, value = 1, tags?: Record<string, string>): MetricPoint {
  return metric(name, 'counter', value, tags);
}

export function gauge(name: string, value: number, tags?: Record<string, string>): MetricPoint {
  return metric(name, 'gauge', value, tags);
}

export function timing(name: string, value: number, tags?: Record<string, string>): MetricPoint {
  return metric(name, 'timing', value, tags);
}

export function metricRatio(
  summaries: MetricSummary[],
  numeratorName: string,
  denominatorName: string,
): MetricRatio {
  const numerator = summaries.find((summary) => summary.name === numeratorName)?.sum ?? 0;
  const denominator = summaries.find((summary) => summary.name === denominatorName)?.sum ?? 0;
  return { numerator, denominator, ratio: denominator > 0 ? numerator / denominator : null };
}

function metric(
  name: string,
  kind: MetricKind,
  value: number,
  tags?: Record<string, string>,
): MetricPoint {
  return { name, kind, value, tags, observedAt: new Date().toISOString() };
}

function summarize(points: MetricPoint[]): MetricSummary {
  const values = points.map((point) => point.value);
  const first = points[0]!;
  return {
    name: first.name,
    kind: first.kind,
    count: points.length,
    sum: values.reduce((sum, value) => sum + value, 0),
    min: Math.min(...values),
    max: Math.max(...values),
    latest: values[values.length - 1] ?? 0,
  };
}
