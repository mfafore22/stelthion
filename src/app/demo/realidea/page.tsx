'use client';

import { useTranslation } from 'react-i18next';
import { ArrowRight, LayoutPanelTop, Sparkles } from 'lucide-react';
import { SpaceOptimizerView } from '@/components/mall/space-optimizer/SpaceOptimizerView';
import { ConciergeProvider, ConciergePanel } from '@/components/concierge';
import { ViewContextProvider } from '@/lib/shoppermind/view-context';
import { getMallIdentity } from '@/lib/mall/mallIdentity';

export default function RealideaDemoPage() {
  const { t } = useTranslation('mall');

  const demoMallId = 'realidea-sello';
  const identity = getMallIdentity(demoMallId);

  return (
    <ViewContextProvider>
      <ConciergeProvider
        tenantId="demo"
        userId="demo-visitor"
        mallId={demoMallId}
        mallOptions={[{ id: demoMallId, name: identity.name }]}
        propertyName={identity.name}
        propertyLogoUrl={identity.logo}
      >
        <ConciergePanel />
        <div className="min-h-screen bg-bo-neutral-50">
          <header className="h-[72px] bg-bo-glass border-b-2 border-bo-neutral-300/60 backdrop-blur-xl flex items-center justify-between px-8 shadow-bo-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bo-primary-100 flex items-center justify-center">
                <LayoutPanelTop className="w-5 h-5 text-bo-primary" />
              </div>
              <span className="font-semibold text-bo-neutral-950 text-lg tracking-tight">
                {t('spaceOptimizer.title')}
              </span>
              <span className="text-xs font-medium bg-bo-primary-100 text-bo-primary-700 px-2 py-0.5 rounded-full border border-bo-primary-200 ml-1 uppercase tracking-wider">
                {t('spaceOptimizer.demo.badge')}
              </span>
            </div>

              href="mailto:sales@stelthion.com"
              className="flex items-center gap-2 px-4 py-2 bg-bo-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-bo-neutral-900 transition-colors shadow-bo-md"
            <a>
              <Sparkles className="w-4 h-4" />
              {t('spaceOptimizer.demo.getAccess')}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </header>

          <main className="max-w-6xl mx-auto px-8 py-8 space-y-6">
            <SpaceOptimizerView
              mallId="sello"
              mallNameOverride="Sello"
              variant="demo"
              mode="demo"
            />

            <div className="rounded-2xl bg-gradient-to-br from-bo-accent to-bo-accent-dark p-8 text-white flex items-center justify-between gap-6 shadow-bo-lg">
              <div>
                <h2 className="text-xl font-semibold mb-1 tracking-tight">
                  {t('spaceOptimizer.demo.ctaTitle')}
                </h2>
                <p className="text-bo-accent-light text-sm">
                  {t('spaceOptimizer.demo.ctaBody')}
                </p>
              </div>
              
                href="mailto:sales@stelthion.com"
                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-bo-accent-dark font-semibold text-sm rounded-xl hover:bg-bo-neutral-100 transition-colors shadow-bo-md"
              <a>
                {t('spaceOptimizer.demo.bookDemo')}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </main>
        </div>
      </ConciergeProvider>
    </ViewContextProvider>
  );
}