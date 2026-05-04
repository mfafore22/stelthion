'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AttachmentShell } from './AttachmentShell';

interface FootfallSparklineProps {
  data: unknown;
  title: string;
}

export function FootfallSparkline({ data, title }: FootfallSparklineProps) {
  if (!data || !Array.isArray(data)) return null;

  const chartData = (data as Array<{ hour: number; avg: number; avgPrevYear?: number | null }>)
    .filter(d => d.hour >= 8 && d.hour <= 21)
    .map(d => ({
      hour: `${d.hour}:00`,
      visitors: d.avg,
      prevYear: d.avgPrevYear ?? undefined,
    }));

  if (chartData.length === 0) return null;

  return (
    <AttachmentShell title={title} tone="green">
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="footfallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#328d2e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#328d2e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value) => [`${value}`, 'Visitors']}
            />
            {chartData[0]?.prevYear !== undefined && (
              <Area
                type="monotone"
                dataKey="prevYear"
                stroke="#bbb"
                strokeWidth={1}
                strokeDasharray="3 3"
                fill="none"
              />
            )}
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#328d2e"
              strokeWidth={2}
              fill="url(#footfallGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AttachmentShell>
  );
}
