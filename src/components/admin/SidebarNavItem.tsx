'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}

export function SidebarNavItem({ href, label, icon: Icon, active }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bo-primary-600 focus-visible:ring-opacity-20 ${
            active
              ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md -translate-y-0.5'
              : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
          }`}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="h-6 w-6" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="nav-tooltip rounded-lg px-3 py-2">
        <div className="text-sm font-semibold text-white tracking-tight">{label}</div>
      </TooltipContent>
    </Tooltip>
  );
}
