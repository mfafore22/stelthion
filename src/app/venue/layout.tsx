'use client';

import { useEffect } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import i18n from '@/lib/i18n';
import { SessionProvider } from '@/contexts/SessionContext';
import { VenueConciergeWrapper } from '@/components/venue/shell/VenueConciergeWrapper';

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('stelthion-language');
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
  }, []);

  return (
    <NextAuthSessionProvider>
      <SessionProvider>
        <VenueConciergeWrapper>{children}</VenueConciergeWrapper>
      </SessionProvider>
    </NextAuthSessionProvider>
  );
}
