'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { HandPlatter } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { AssistantsView } from '@/components/mall/assistants/AssistantsView';

export default function AssistantsPage() {
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
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-bo-neutral-50">
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
          <Header />
          <AssistantsView />
        </div>
      </main>
    </>
  );
}

function Header() {
  const { t } = useTranslation('mall');
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-bo-primary-100 flex items-center justify-center">
        <HandPlatter className="w-7 h-7 text-bo-primary-700" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-bo-neutral-950 tracking-tight">
          {t('assistants.title')}
        </h1>
        <p className="text-sm font-medium text-bo-neutral-700">
          {t('assistants.description')}
        </p>
      </div>
    </div>
  );
}
