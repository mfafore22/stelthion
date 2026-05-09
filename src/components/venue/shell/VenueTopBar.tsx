'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2, Calendar, Clock, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { CompactLanguageSelector } from '@/components/ui/language-selector';
import { PropertySpeechBubble } from '@/components/concierge/PropertySpeechBubble';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils';

export function VenueTopBar() {
  const { user } = useSession();
  const concierge = useConciergeOptional();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed left-[80px] right-0 top-0 z-40 flex h-[80px] items-center justify-between border-b border-bo-neutral-200/60 border-t border-white/80 bg-white/40 px-8 shadow-[0_4px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
      <Image src="/stelthion-brandmark.png" alt="Stelthion" width={220} height={60} className="object-contain" priority />
      <div className="flex items-center gap-4 text-sm text-bo-neutral-700">
        <Calendar className="h-4 w-4 text-bo-neutral-500" />
        <span className="font-medium">{now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <span className="h-4 w-px bg-bo-neutral-300" />
        <Clock className="h-4 w-4 text-bo-neutral-500" />
        <span className="font-medium tabular-nums">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="flex items-center gap-3">
        {concierge && (
          <PropertySpeechBubble
            isOpen={concierge.state?.panelOpen ?? false}
            unreadCount={concierge.state?.conversations?.length ?? 0}
            onClick={() => concierge.togglePanel()}
            propertyName={concierge.propertyName}
          />
        )}
        <CompactLanguageSelector />
        {concierge && concierge.mallOptions.length > 1 && (
          <select
            value={concierge.mallId}
            onChange={(event) => concierge.setMallFocus(event.target.value)}
            className="rounded-lg border border-bo-neutral-200 bg-white px-3 py-2 text-sm font-medium text-bo-neutral-800 shadow-bo-sm"
            aria-label="Venue focus"
          >
            {concierge.mallOptions.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
          </select>
        )}
        <button className="flex items-center gap-2 rounded-lg border border-bo-neutral-200 bg-bo-neutral-100 px-4 py-2.5 text-sm font-medium text-bo-neutral-900">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{user?.companyName ?? 'Venue customer'}</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn('flex items-center gap-2 rounded-lg bg-bo-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-bo-neutral-900')}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
