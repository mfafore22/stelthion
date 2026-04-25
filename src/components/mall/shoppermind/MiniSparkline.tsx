'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { PhenomenonScoreRow } from '@stelthion/shoppermind-client-types';

export function MiniSparkline({
  scores,
  color = '#328d2e',
  height = 28,
}: {
  scores: PhenomenonScoreRow[];
  color?: string;
  height?: number;
}) {
  if (scores.length < 2) {
    return <div style={{ height }} className="w-full" />;
  }
  const sorted = [...scores].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const data = sorted.map((s) => ({ v: s.compositeScore }));

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
