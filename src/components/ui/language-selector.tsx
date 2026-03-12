/**
 * Language Selector Component
 *
 * Dropdown selector for switching languages with flag icons
 */

'use client';

import React from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/config';
import { useLanguage } from '@/lib/i18n/hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Language code text mapping (replaces flag emojis)
 */
const LANGUAGE_CODE_TEXT: Record<string, string> = {
  GB: 'ENG',
  FI: 'FIN',
  SE: 'SWE',
  NO: 'NOR',
  DK: 'DAN',
  ES: 'ESP',
  DE: 'DE',
  EE: 'EST',
  LV: 'LAV',
  NL: 'NLD',
  FR: 'FR',
  IT: 'IT',
  PL: 'POL',
  LT: 'LIT',
  PT: 'POR',
  CZ: 'CZE',
};

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'default',
  showLabel = true,
  className,
}: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage } = useLanguage();

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' || variant === 'icon-only' ? 'sm' : 'default'}
          className={cn(
            'gap-2',
            variant === 'icon-only' && 'px-2',
            className
          )}
        >
          {variant === 'icon-only' ? (
            <Globe className="h-4 w-4" />
          ) : (
            <>
              <span className="text-xs font-semibold uppercase tracking-wider text-bo-neutral-700" aria-label={currentLang.name}>
                {LANGUAGE_CODE_TEXT[currentLang.flag]}
              </span>
              {showLabel && variant !== 'compact' && (
                <span className="hidden sm:inline">{currentLang.nativeName}</span>
              )}
              {variant !== 'icon-only' && <ChevronDown className="h-4 w-4 opacity-50" />}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-white border border-neutral-200 shadow-lg">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-bo-neutral-600 w-10" aria-label={lang.name}>
                {LANGUAGE_CODE_TEXT[lang.flag]}
              </span>
              <span>{lang.nativeName}</span>
            </div>
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact language selector (flag only with dropdown)
 */
export function CompactLanguageSelector({ className }: { className?: string }) {
  return <LanguageSelector variant="compact" showLabel={false} className={className} />;
}

/**
 * Icon-only language selector
 */
export function IconOnlyLanguageSelector({ className }: { className?: string }) {
  return <LanguageSelector variant="icon-only" className={className} />;
}
