'use client';

import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';

interface EventCardProps {
  data: unknown;
  title: string;
}

export function EventCard({ data, title }: EventCardProps) {
  if (!data || !Array.isArray(data)) return null;

  const events = (data as Array<{
    name: string;
    date: string;
    venue: string;
    type?: string;
    expectedAttendance?: number;
    distanceKm?: number;
  }>).slice(0, 4);

  return (
    <div className="bg-bo-glass-subtle border border-bo-neutral-200/30 rounded-xl p-3 mt-2">
      <div className="text-[10px] font-medium text-bo-neutral-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-2">
        {events.map((e, i) => {
          const date = new Date(e.date);
          const dateStr = date.toLocaleDateString('fi-FI', { weekday: 'short', day: 'numeric', month: 'short' });
          return (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bo-accent-50 flex flex-col items-center justify-center">
                <span className="text-[10px] font-medium text-bo-accent-600">
                  {date.toLocaleDateString('fi-FI', { day: 'numeric' })}
                </span>
                <span className="text-[8px] text-bo-accent-500 uppercase">
                  {date.toLocaleDateString('fi-FI', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-bo-neutral-900 truncate">{e.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-bo-neutral-500">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" /> {e.venue}
                  </span>
                  {e.expectedAttendance && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" /> {(e.expectedAttendance / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
