'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  active: boolean;
  label: string;
}

/**
 * Top-of-sidebar slot, level with the global Stelthion logo bar.
 * Distinct amber theme marks it as a Stelthion-only super-admin function
 * (cross-tenant customer management) — separate from the per-tenant nav below.
 */
export function SidebarCustomersSlot({ active, label }: Props) {
  return (
    <div className="h-[80px] w-full shrink-0 flex items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/admin/customers"
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-opacity-30 ${
              active
                ? 'bg-amber-500 text-white shadow-bo-md ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 hover:ring-amber-300'
            }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Building2 className="h-6 w-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="nav-tooltip rounded-lg px-3 py-2">
          <div className="text-sm font-semibold text-white tracking-tight">{label}</div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
