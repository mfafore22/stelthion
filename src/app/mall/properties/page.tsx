'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { PropertyDetail } from '@/components/mall/PropertyDetail';

export default function PropertiesPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mall/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F6F3]">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
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
      <MallTopBar selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <main className="ml-[80px] mt-[80px] h-[calc(100vh-80px)] overflow-auto bg-[#F8F6F3]">
        <div className="p-8 max-w-[1600px] mx-auto">
          <PropertyDetail mallId={mallId} />
        </div>
      </main>
    </>
  );
}
