'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks';
import '@/lib/i18n';
import { LayoutDashboard, Map, ClipboardList, Route } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { href: '/admin/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { href: '/admin/floorplan/ideapark', labelKey: 'sidebar.floorPlan', icon: Map },
  { href: '/admin/jobs', labelKey: 'sidebar.analysisJobs', icon: ClipboardList },
  { href: '/admin/results', labelKey: 'sidebar.resultsJourneys', icon: Route },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation('admin');

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-[80px] border-r border-bo-neutral-200 bg-bo-neutral-50 flex flex-col items-center shadow-bo-sm">
        {/* Swirl logo */}
        <div className="h-[80px] w-full flex items-center justify-center shrink-0">
          <Image
            src="/stelthion-swirl-v2.png"
            alt="Stelthion"
            width={26}
            height={26}
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3 py-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`
                      w-14 h-14 rounded-xl flex items-center justify-center
                      transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bo-primary-600 focus-visible:ring-opacity-20
                      ${active
                        ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md -translate-y-0.5'
                        : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
                      }
                    `}
                    aria-label={t(item.labelKey)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <item.icon className="h-6 w-6" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="nav-tooltip rounded-lg px-3 py-2"
                >
                  <div className="text-sm font-semibold text-white tracking-tight">
                    {t(item.labelKey)}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}