'use client';

import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AdminCustomerSwitcher({ customerName }: { customerName: string }) {
  return (
    <div className="mt-auto pb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/select-customer"
            className="w-14 h-14 rounded-xl flex items-center justify-center text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950 transition-colors"
            aria-label="Switch customer"
          >
            <ArrowLeftRight className="h-6 w-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="nav-tooltip rounded-lg px-3 py-2">
          <div className="text-sm font-semibold text-white tracking-tight">
            Switch customer{customerName ? `: ${customerName}` : ''}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
