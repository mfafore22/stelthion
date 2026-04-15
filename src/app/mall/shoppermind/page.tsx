'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { ShopperMindDashboard } from '@/components/shoppermind/ShopperMindDashboard';

export default function ShopperMindPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  const { t } = useTranslation('mall');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mall/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F6F3]">
        <div className="animate-pulse text-gray-400 text-sm">
          {t('common.loading', 'Loading...')}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-[#F8F6F3]">
        <div className="p-8 max-w-[1600px] mx-auto">
          <ShopperMindDashboard userId={user.id ?? 'anonymous'} />
        </div>
      </main>
    </>
  );
}
