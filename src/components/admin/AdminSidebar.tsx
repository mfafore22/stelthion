'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n'; // ensure i18n is initialized before first render
import { LayoutDashboard, Map, Video, ClipboardList, Route } from 'lucide-react';

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
    <aside className="w-56 border-r border-bo-neutral-200 bg-bo-neutral-50 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-bo-neutral-200">
        <Video className="w-5 h-5 text-bo-accent-600 mr-2" />
        <span className="font-semibold text-sm text-bo-neutral-950 tracking-wide">{t('sidebar.title')}</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                active
                  ? 'bg-bo-accent-600 text-white font-medium shadow-bo-md -translate-y-0.5'
                  : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
