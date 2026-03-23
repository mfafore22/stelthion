'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { CompactLanguageSelector } from '@/components/ui/language-selector';

export function AdminHeader() {
  const { t } = useTranslation('admin');

  // Restore saved language after hydration
  useEffect(() => {
    const saved = localStorage.getItem('stelthion-language');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);

  return (
    <header className="h-[80px] bg-glass border-b-[4px] border-bo-neutral-700/50 shadow-bo-sm flex items-center justify-between px-8">
      {/* Left: Stelthion text brandmark + Admin Tool label */}
      <div className="flex items-center gap-3">
        <Image
          src="/stelthion-brandmark.png"
          alt="Stelthion"
          width={220}
          height={60}
          className="object-contain"
          priority
        />
        <div className="w-px h-8 bg-bo-neutral-300" />
        <span className="text-sm font-semibold text-bo-neutral-600 tracking-wide">Admin Tool</span>
      </div>

      {/* Right: Language selector */}
      <div className="flex items-center">
        <CompactLanguageSelector />
      </div>
    </header>
  );
}
