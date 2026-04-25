'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  FileText,
  Sheet,
  FileSpreadsheet,
  LogOut,
  Building2,
  Calendar,
  Clock,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { signOut } from 'next-auth/react';
import { CompactLanguageSelector } from '@/components/ui/language-selector';
import { useConciergeOptional } from '@/components/concierge/ConciergeContext';
import { PropertySpeechBubble } from '@/components/concierge/PropertySpeechBubble';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

export interface MallTopBarProps {
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  className?: string;
}

export function MallTopBar({
  onExport,
  className,
}: MallTopBarProps) {
  const { user } = useSession();
  const concierge = useConciergeOptional();
  const { t, i18n } = useTranslation('mall');

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const locale = i18n.language === 'fi' ? 'fi-FI' : i18n.language === 'sv' ? 'sv-SE' : 'en-GB';
  const displayDate = now.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const displayTime = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
    } else {
      console.log(`Export as ${format}`);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-[80px] right-0 h-[80px]',
        'bg-white/40 backdrop-blur-2xl saturate-150',
        'border-t border-white/80 border-b border-bo-neutral-200/60',
        'shadow-[0_4px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]',
        'flex items-center justify-between px-8 z-40',
        className
      )}
    >
      {/* Left: Stelthion text brandmark */}
      <div className="flex items-center">
        <Image
          src="/stelthion-brandmark.png"
          alt="Stelthion"
          width={220}
          height={60}
          className="object-contain"
          priority
        />
      </div>

      {/* Center: Live Date & Time */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-bo-neutral-700">
          <Calendar className="h-4 w-4 text-bo-neutral-500" />
          <span className="font-medium">{displayDate}</span>
        </div>
        <div className="h-4 w-px bg-bo-neutral-300" />
        <div className="flex items-center gap-2 text-sm text-bo-neutral-700">
          <Clock className="h-4 w-4 text-bo-neutral-500" />
          <span className="font-medium tabular-nums">{displayTime}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Concierge Speech Bubble */}
        {concierge && (
          <PropertySpeechBubble
            isOpen={concierge.state?.panelOpen ?? false}
            unreadCount={concierge.state?.conversations?.length ?? 0}
            onClick={() => concierge.togglePanel()}
            propertyName="Ideapark"
          />
        )}

        {/* Language Selector */}
        <CompactLanguageSelector />

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg',
                  'bg-bo-neutral-100 text-bo-neutral-900 border border-bo-neutral-200',
                  'hover:bg-bo-neutral-200 hover:border-bo-neutral-300',
                  'transition-all duration-200',
                  'text-sm font-medium'
                )}
                aria-label={t('topbar.userMenu')}
              >
                <Building2 className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{user.companyName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-white/95 backdrop-blur-md border-bo-neutral-300 shadow-bo-xl rounded-xl p-2"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-bo-neutral-950">{user.companyName}</p>
                  <p className="text-xs text-bo-neutral-600">{user.mallDisplayName}</p>
                  <p className="text-xs text-bo-neutral-500 mt-1">{t('topbar.userId')} {user.userId}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-bo-neutral-200 my-2" />
              <DropdownMenuItem
                onClick={() => window.location.href = '/change-password'}
                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-md hover:bg-bo-neutral-100 transition-colors text-bo-neutral-700"
              >
                <KeyRound className="h-4 w-4" />
                <span className="font-medium">{t('topbar.changePassword', 'Change Password')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-md hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">{t('topbar.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg',
                'bg-bo-neutral-950 text-bo-neutral-50',
                'hover:bg-bo-neutral-900 hover:shadow-bo-lg hover:-translate-y-0.5',
                'active:translate-y-0 active:duration-100',
                'transition-all duration-300 ease-bo-out-expo',
                'text-sm font-medium tracking-wide shadow-bo-md'
              )}
            >
              <Download className="h-4 w-4" />
              {t('topbar.export')}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-bo-neutral-50 border-bo-neutral-200 shadow-bo-xl rounded-xl p-2"
          >
            <DropdownMenuLabel className="text-xs text-bo-neutral-600 font-medium uppercase tracking-wider px-2 py-1">
              {t('topbar.exportFormat')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-bo-neutral-200 my-2" />
            <DropdownMenuItem
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-md hover:bg-bo-neutral-100 transition-colors"
            >
              <FileText className="h-4 w-4 text-bo-neutral-600" />
              <span className="text-bo-neutral-900">{t('topbar.pdfReport')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport('csv')}
              className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-md hover:bg-bo-neutral-100 transition-colors"
            >
              <Sheet className="h-4 w-4 text-bo-neutral-600" />
              <span className="text-bo-neutral-900">{t('topbar.csvData')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport('excel')}
              className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-md hover:bg-bo-neutral-100 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-bo-neutral-600" />
              <span className="text-bo-neutral-900">{t('topbar.excelWorkbook')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}