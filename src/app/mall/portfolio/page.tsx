'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';

/**
 * /mall/portfolio — redirect to the user's actual mall or login.
 * For single-property tenants: → /mall/[mallId]
 * For multi-property tenants: → /tenant/[slug]/portfolio
 * Unauthenticated: → /mall/login
 */
export default function PortfolioRedirectPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/mall/login');
      return;
    }

    if (user.isMultiProperty) {
      const tenantSlug = user.companyName.toLowerCase().replace(/\s+/g, '-');
      router.replace(`/tenant/${tenantSlug}/portfolio`);
    } else {
      router.replace(`/mall/${user.mallId}`);
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
    </div>
  );
}
