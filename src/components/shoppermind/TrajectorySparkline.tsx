'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { PhenomenonState } from '@prisma/client';

const STATE_COLOR: Record<PhenomenonState, string> = {
  EMERGING: '#3b82f6',
  ACCELERATING: '#10b981',
  STABLE: '#9ca3af',
  FADING: '#f59e0b',
  DORMANT: '#d1d5db',
};

interface Point {
  date: string;
  compositeScore: number;
}

interface TrajectorySparklineProps {
  data: Point[];
  state: PhenomenonState;
  height?: number;
}

export function TrajectorySparkline({ data, state, height = 48 }: TrajectorySparklineProps) {
  const color = STATE_COLOR[state] ?? '#3b82f6';
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={sorted} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`sm-grad-${state}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(v) => [Number(v).toFixed(2), 'Score']}
          labelFormatter={(d) => String(d)}
        />
        <Area
          type="monotone"
          dataKey="compositeScore"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sm-grad-${state})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
