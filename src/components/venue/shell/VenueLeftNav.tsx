'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, HandPlatter, Landmark, RadioTower, ShieldCheck, WalletCards } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { id: 'portfolio', label: 'Portfolio', icon: Landmark, route: '/venue/portfolio' },
  { id: 'overview', label: 'Overview', icon: Landmark, route: '/venue/overview' },
  { id: 'venuemind', label: 'VenueMind', icon: BarChart3, route: '/venue/venuemind' },
  { id: 'events', label: 'Events', icon: CalendarDays, route: '/venue/events' },
  { id: 'operations', label: 'Operations', icon: ShieldCheck, route: '/venue/operations' },
  { id: 'commercial', label: 'Commercial', icon: WalletCards, route: '/venue/commercial' },
  { id: 'assistants', label: 'Assistants', icon: HandPlatter, route: '/venue/assistants' },
];

export function VenueLeftNav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="fixed left-0 top-0 z-40 flex h-screen w-[80px] flex-col items-center border-r border-bo-neutral-200 bg-bo-neutral-50 shadow-bo-sm">
      <div className="flex h-[80px] w-full shrink-0 items-center justify-center">
        <Image src="/stelthion-brand-s.png" alt="Stelthion" width={42} height={44} className="object-contain" priority />
      </div>
      <div className="flex flex-col items-center gap-3 py-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.route);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.route)}
              className={cn(
                'group flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 ease-bo-out-expo',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bo-primary-600/20',
                active
                  ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md -translate-y-0.5'
                  : 'text-bo-neutral-600 hover:bg-bo-neutral-100 hover:text-bo-neutral-950',
              )}
              aria-label={item.label}
            >
              <Icon className="h-8 w-8" />
            </button>
          );
        })}
      </div>
      <RadioTower className="mt-auto mb-6 h-5 w-5 text-bo-neutral-400" />
    </nav>
  );
}
