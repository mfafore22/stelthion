'use client';

import { ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MallOption {
  mallId: string;
  name: string;
  city: string;
}

export function AdminMallSwitcher({
  malls,
  activeMallId,
  onChange,
  alignToBottom,
}: {
  malls: MallOption[];
  activeMallId: string;
  onChange: (mallId: string) => void;
  alignToBottom: boolean;
}) {
  return (
    <div className={alignToBottom ? 'mt-auto mb-4' : 'mb-4'}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <select
              value={activeMallId}
              onChange={(e) => onChange(e.target.value)}
              className="w-14 h-14 rounded-xl bg-bo-neutral-100 text-bo-neutral-600 text-[10px] font-semibold uppercase tracking-wider text-center appearance-none cursor-pointer hover:bg-bo-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-bo-primary-600/20"
            >
              {malls.map((m) => (
                <option key={m.mallId} value={m.mallId}>
                  {m.mallId.slice(0, 4).toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-bo-neutral-400 absolute bottom-1.5 left-1/2 -translate-x-1/2 pointer-events-none" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="nav-tooltip rounded-lg px-3 py-2">
          <div className="text-sm font-semibold text-white tracking-tight">
            {malls.find((m) => m.mallId === activeMallId)?.name ?? activeMallId}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
