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
    <header className="h-20 border-b border-bo-neutral-200 bg-bo-neutral-50 shadow-bo-sm flex items-center px-6">
      <div className="flex items-center gap-3">
        <Image
          src="/stelthion-brandmark.png"
          alt="Stelthion"
          width={128}
          height={128}
          className="object-contain"
          priority
        />
        <h1 className="text-lg font-semibold text-bo-neutral-950 tracking-wide">{t('header.title')}</h1>
      </div>
      <div className="ml-auto">
        <CompactLanguageSelector />
      </div>
    </header>
  );
}
