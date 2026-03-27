'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/hooks';
import i18n from '@/lib/i18n';
import { CompactLanguageSelector } from '@/components/ui/language-selector';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function AdminHeader() {
  const { t } = useTranslation('admin');

  useEffect(() => {
    const saved = localStorage.getItem('stelthion-language');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, []);

  return (
    <header className="h-[80px] bg-glass border-b-[4px] border-bo-neutral-700/50 shadow-bo-sm flex items-center justify-between px-8">
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

      <div className="flex items-center gap-4">
        <CompactLanguageSelector />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}