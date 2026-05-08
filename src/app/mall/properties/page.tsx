'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { PropertyDetail } from '@/components/mall/PropertyDetail';

export default function PropertiesPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mall/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bo-neutral-50">
        <div className="animate-pulse text-sm text-bo-neutral-400">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const mallId = user.mallId;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />

      <main className="ml-[80px] h-screen overflow-auto bg-bo-neutral-50 pt-[80px]">
        <div className="p-8 max-w-[1600px] mx-auto">
          <PropertyDetail mallId={mallId} />
        </div>
      </main>
    </>
  );
}
