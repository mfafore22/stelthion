'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VenueLeftNav } from './VenueLeftNav';
import { VenueTopBar } from './VenueTopBar';
import { useSession } from '@/contexts/SessionContext';

export function VenuePageChrome({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-bo-neutral-50 text-sm text-bo-neutral-400">Loading...</div>;
  }
  if (!user) return null;

  return (
    <>
      <VenueLeftNav />
      <VenueTopBar />
      <main className="ml-[80px] h-screen overflow-auto bg-bo-neutral-50 pt-[80px]">
        <div className="mx-auto max-w-[1600px] space-y-6 p-8">{children}</div>
      </main>
    </>
  );
}
