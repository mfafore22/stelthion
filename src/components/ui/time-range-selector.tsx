/**
 * TimeRangeSelector Component
 * Allows users to select time range for dashboard data
 */

import React from 'react';
import { Clock } from 'lucide-react';
import type { TimeRange } from '@/hooks/useRetailDashboard';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
];

export function TimeRangeSelector({ value, onChange, className = '' }: TimeRangeSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${
                value === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
