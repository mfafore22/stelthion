'use client';

import React from 'react';
import { Car } from 'lucide-react';

interface ParkingStatusCardProps {
  data: unknown;
  title: string;
}

export function ParkingStatusCard({ data, title }: ParkingStatusCardProps) {
  if (!data) return null;

  const d = data as {
    levels: Array<{ id: string; capacity: number; currentOccupancy: number }>;
    totalCapacity: number;
    currentUtilization: number;
  };

  return (
    <div className="bg-bo-glass-subtle border border-bo-neutral-200/30 rounded-xl p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-medium text-bo-neutral-500 uppercase tracking-wider">{title}</div>
        <div className="text-xs font-semibold text-bo-neutral-900">
          {Math.round(d.currentUtilization)}%
        </div>
      </div>
      <div className="space-y-1.5">
        {d.levels.map((level) => {
          const pct = Math.round((level.currentOccupancy / level.capacity) * 100);
          const color = pct > 85 ? 'bg-bo-error' : pct > 60 ? 'bg-bo-warning' : 'bg-bo-success';
          return (
            <div key={level.id} className="flex items-center gap-2">
              <span className="text-[10px] text-bo-neutral-600 w-20 truncate">{level.id}</span>
              <div className="flex-1 h-2 bg-bo-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-bo-neutral-500 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
