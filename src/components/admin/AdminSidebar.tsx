'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks';
import '@/lib/i18n';
import { LayoutDashboard, Map, ClipboardList, Route, Cpu, BarChart3, Tag, MessageSquare, MousePointerClick } from 'lucide-react';
import useSWR from 'swr';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAdminMall } from '@/lib/hooks/useAdminMall';
import { AdminMallSwitcher } from './AdminMallSwitcher';
import { AdminCustomerSwitcher } from './AdminCustomerSwitcher';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarCustomersSlot } from './SidebarCustomersSlot';

interface MallOption {
  mallId: string;
  name: string;
  city: string;
}

interface CustomerContext {
  id: string;
  name: string;
  canSwitch: boolean;
  isStelthionAdmin: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation('admin');
  const { activeMallId, setActiveMallId } = useAdminMall();
  const { data: malls } = useSWR<MallOption[]>('/api/admin/malls', fetcher);
  const { data: ctx } = useSWR<CustomerContext>('/api/admin/customer-context', fetcher);

  const isStelthionAdmin = ctx?.isStelthionAdmin ?? false;
  const navItems = [
    { href: '/admin/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    ...(activeMallId
      ? [{ href: `/admin/floorplan/${activeMallId}`, labelKey: 'sidebar.floorPlan', icon: Map }]
      : []),
    { href: '/admin/counters', labelKey: 'sidebar.counterData', icon: BarChart3 },
    { href: '/admin/jobs', labelKey: 'sidebar.analysisJobs', icon: ClipboardList },
    { href: '/admin/results', labelKey: 'sidebar.resultsJourneys', icon: Route },
    { href: '/admin/edge', labelKey: 'sidebar.edgeDevices', icon: Cpu },
    { href: '/admin/shoppermind/feedback', labelKey: 'sidebar.shopperMindFeedback', icon: MessageSquare },
    { href: '/admin/shoppermind/activity', labelKey: 'sidebar.shopperMindActivity', icon: MousePointerClick },
    ...(isStelthionAdmin
      ? [{ href: '/admin/plans', labelKey: 'sidebar.plans', icon: Tag }]
      : []),
  ];

  const showMallSelector = malls && malls.length > 1;

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-[80px] border-r border-bo-neutral-200 bg-bo-neutral-50 flex flex-col items-center shadow-bo-sm">
        {isStelthionAdmin ? (
          <SidebarCustomersSlot
            active={pathname.startsWith('/admin/customers')}
            label={t('sidebar.customers')}
          />
        ) : (
          <div className="h-[80px] w-full shrink-0" />
        )}

        <nav className="flex flex-col items-center gap-3 py-3">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}
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
