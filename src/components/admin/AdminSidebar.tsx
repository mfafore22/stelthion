'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks';
import '@/lib/i18n';
import { LayoutDashboard, Map, ClipboardList, Route, Cpu, BarChart3, Building2, Tag, MessageSquare } from 'lucide-react';
import useSWR from 'swr';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAdminMall } from '@/lib/hooks/useAdminMall';
import { AdminMallSwitcher } from './AdminMallSwitcher';
import { AdminCustomerSwitcher } from './AdminCustomerSwitcher';

interface MallOption {
  mallId: string;
  name: string;
  city: string;
}

interface CustomerContext {
  id: string;
  name: string;
  canSwitch: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation('admin');
  const { activeMallId, setActiveMallId } = useAdminMall();
  const { data: malls } = useSWR<MallOption[]>('/api/admin/malls', fetcher);
  const { data: ctx } = useSWR<CustomerContext>('/api/admin/customer-context', fetcher);

  const navItems = [
    { href: '/admin/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { href: `/admin/floorplan/${activeMallId}`, labelKey: 'sidebar.floorPlan', icon: Map },
    { href: '/admin/counters', labelKey: 'sidebar.counterData', icon: BarChart3 },
    { href: '/admin/jobs', labelKey: 'sidebar.analysisJobs', icon: ClipboardList },
    { href: '/admin/results', labelKey: 'sidebar.resultsJourneys', icon: Route },
    { href: '/admin/edge', labelKey: 'sidebar.edgeDevices', icon: Cpu },
    { href: '/admin/customers', labelKey: 'sidebar.customers', icon: Building2 },
    { href: '/admin/shoppermind/feedback', labelKey: 'sidebar.shopperMindFeedback', icon: MessageSquare },
    { href: '/admin/plans', labelKey: 'sidebar.plans', icon: Tag },
  ];

  const showMallSelector = malls && malls.length > 1;

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-[80px] border-r border-bo-neutral-200 bg-bo-neutral-50 flex flex-col items-center shadow-bo-sm">
        <div className="h-[80px] w-full shrink-0" />
        <nav className="flex flex-col items-center gap-3 py-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bo-primary-600 focus-visible:ring-opacity-20 ${active ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md -translate-y-0.5' : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'}`}
                    aria-label={t(item.labelKey)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <item.icon className="h-6 w-6" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="nav-tooltip rounded-lg px-3 py-2">
                  <div className="text-sm font-semibold text-white tracking-tight">
                    {t(item.labelKey)}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {ctx?.canSwitch && <AdminCustomerSwitcher customerName={ctx.name} />}

        {showMallSelector && (
          <AdminMallSwitcher
            malls={malls}
            activeMallId={activeMallId}
            onChange={setActiveMallId}
            alignToBottom={!ctx?.canSwitch}
          />
        )}
      </aside>
    </TooltipProvider>
  );
}
