/**
 * Mall Top Bar
 *
 * Fixed 80px header with temporal controls and export.
 * Features:
 * - Stelthion brandmark
 * - Date/time pickers for temporal navigation
 * - AI concierge toggle
 * - Language selector
 * - User profile / logout
 * - Export dropdown (PDF, CSV, Excel)
 */

'use client';

import Image from 'next/image';
import {
  Download,
  FileText,
  Sheet,
  FileSpreadsheet,
  LogOut,
  Building2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { CompactLanguageSelector } from '@/components/ui/language-selector';
import { useConcierge } from '@/components/concierge/ConciergeContext';
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
  selectedDate?: string;
  selectedTime?: string;
  onDateChange?: (date: string) => void;
  onTimeChange?: (time: string) => void;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  className?: string;
}

export function MallTopBar({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onExport,
  className,
}: MallTopBarProps) {
  const { user, logout } = useSession();
  const concierge = useConcierge();
  const { t } = useTranslation('mall');

  const now = new Date();
  const currentDate = selectedDate || now.toISOString().split('T')[0];
  const currentTime = selectedTime || now.toTimeString().slice(0, 5);

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
        'bg-glass border-b-[4px] border-bo-neutral-700/50',
        'flex items-center justify-between px-8 z-40 shadow-bo-sm',
        className
      )}
    >
      {/* Left: Stelthion Brandmark */}
      <div className="flex items-center">
        <Image
          src="/stelthion-brandmark.png"
          alt="Stelthion"
          width={44}
          height={44}
          className="object-contain"
          priority
        />
      </div>

      {/* Center: Temporal Controls */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={currentDate}
          onChange={(e) => onDateChange?.(e.target.value)}
          className={cn(
            'px-4 py-2.5 rounded-lg border border-bo-neutral-300',
            'text-sm text-bo-neutral-900 bg-bo-neutral-50',
            'focus:outline-none focus:ring-2 focus:ring-bo-primary-600 focus:ring-opacity-20 focus:border-bo-primary-600',
            'hover:border-bo-neutral-400 transition-all duration-200 ease-bo-out'
          )}
          aria-label={t('topbar.dateLabel')}
        />
        <input
          type="time"
          value={currentTime}
          onChange={(e) => onTimeChange?.(e.target.value)}
          className={cn(
            'px-4 py-2.5 rounded-lg border border-bo-neutral-300',
            'text-sm text-bo-neutral-900 bg-bo-neutral-50',
            'focus:outline-none focus:ring-2 focus:ring-bo-primary-600 focus:ring-opacity-20 focus:border-bo-primary-600',
            'hover:border-bo-neutral-400 transition-all duration-200 ease-bo-out'
          )}
          aria-label={t('topbar.timeLabel')}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Concierge AI Assistant Toggle */}
        {concierge && (
          <button
            onClick={() => concierge.togglePanel()}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200',
              concierge.state?.panelOpen
                ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-600/30'
                : 'bg-bo-neutral-100 text-bo-neutral-900 border-bo-neutral-200 hover:bg-bo-neutral-200 hover:border-bo-neutral-300'
            )}
            aria-label={t('topbar.concierge')}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">{t('topbar.concierge')}</span>
            {concierge.state?.conversations?.length > 0 && !concierge.state?.panelOpen && (
              <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {concierge.state.conversations.length}
              </span>
            )}
          </button>
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
                onClick={() => logout()}
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
