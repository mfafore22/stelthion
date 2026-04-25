'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks';
import '@/lib/i18n';
import { LayoutDashboard, Map, ClipboardList, Route, Cpu, BarChart3, ChevronDown, Building2, Tag } from 'lucide-react';
import useSWR from 'swr';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAdminMall } from '@/lib/hooks/useAdminMall';

interface MallOption {
  mallId: string;
  name: string;
  city: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation('admin');
  const { activeMallId, setActiveMallId } = useAdminMall();
  const { data: malls } = useSWR<MallOption[]>('/api/admin/malls', fetcher);

  const navItems = [
    { href: '/admin/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { href: `/admin/floorplan/${activeMallId}`, labelKey: 'sidebar.floorPlan', icon: Map },
    { href: '/admin/counters', labelKey: 'sidebar.counterData', icon: BarChart3 },
    { href: '/admin/jobs', labelKey: 'sidebar.analysisJobs', icon: ClipboardList },
    { href: '/admin/results', labelKey: 'sidebar.resultsJourneys', icon: Route },
    { href: '/admin/edge', labelKey: 'sidebar.edgeDevices', icon: Cpu },
    { href: '/admin/customers', labelKey: 'sidebar.customers', icon: Building2 },
    { href: '/admin/plans', labelKey: 'sidebar.plans', icon: Tag },
  ];

  const showMallSelector = malls && malls.length > 1;

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-[80px] border-r border-bo-neutral-200 bg-bo-neutral-50 flex flex-col items-center shadow-bo-sm">
        {/* Spacer matching the 80px top bar row */}
        <div className="h-[80px] w-full shrink-0" />

        {/* Navigation Items — icon-only rail */}
        <nav className="flex flex-col items-center gap-3 py-3">
          {navItems.map((item) => {
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

        {/* Mall selector — only shown when multiple malls exist */}
        {showMallSelector && (
          <div className="mt-auto mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <select
                    value={activeMallId}
                    onChange={(e) => setActiveMallId(e.target.value)}
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
        )}
      </aside>
    </TooltipProvider>
  );
}
