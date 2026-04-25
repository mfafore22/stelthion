'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { SpaceOptimizerView } from '@/components/mall/space-optimizer/SpaceOptimizerView';

export default function SpaceOptimizerPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const { t } = useTranslation('mall');

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bo-neutral-50">
        <div className="animate-pulse text-bo-neutral-400 text-sm">
          {t('spaceOptimizer.demo.loading')}
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-bo-neutral-50">
        <div className="p-8 max-w-[1600px] mx-auto">
          <SpaceOptimizerView mallId={user.mallId} variant="app" mode="live" />
        </div>
      </main>
    </>
  );
}
