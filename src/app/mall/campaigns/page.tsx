'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { CampaignsWorkspace } from '@/components/mall/campaigns/CampaignsWorkspace';

export default function CampaignsPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const { t } = useTranslation('mall');

  useEffect(() => {
    if (!loading && !user) router.replace('/mall/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bo-neutral-50">
        <div className="animate-pulse text-sm text-bo-neutral-400">
          {t('common.loading', 'Loading…')}
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <MallLeftNav />
      <MallTopBar />
      <main className="ml-[80px] h-screen overflow-auto bg-bo-neutral-50 pt-[80px]">
        <div className="mx-auto max-w-[1600px] p-8">
          <CampaignsWorkspace />
        </div>
      </main>
    </>
  );
}
