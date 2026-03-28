'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { PropertyDetail } from '@/components/mall/PropertyDetail';
import { useMallDetail } from '@/hooks/mall/useMallData';
import { useMallIdentity } from '@/hooks/mall/useMallIdentity';
import {
  getZoneVisitors,
  type IdeaparkZone,
} from '@/lib/data/ideaparkZones';
import {
  generateFlowReportPDF,
  generateFlowReportCSV,
  type ReportParams,
} from '@/lib/export/reportGenerator';

export default function PropertiesPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  const router = useRouter();
  const { i18n } = useTranslation();

  const mallId = user?.customerId ?? 'ideapark';
  const { data: mallData } = useMallDetail(mallId);
  const resolvedMallId = mallData?.mallId ?? mallId;
  const identity = useMallIdentity(resolvedMallId);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mall/login');
    }
  }, [loading, user, router]);

  const handleExport = useCallback(async (format: 'pdf' | 'csv' | 'excel') => {
    const now = new Date();
    const hour = now.getHours() >= 10 && now.getHours() <= 21 ? now.getHours() : 14;
    const dayOfWeek = now.getDay();

    // Fetch actual published zones from the database — not static fallback
    let dbZones: IdeaparkZone[] = [];
    try {
      const res = await fetch(`/api/floorplan/${resolvedMallId}?floor=ground`);
      if (res.ok) {
        const data = await res.json();
        dbZones = data.zones ?? [];
      }
    } catch {
      // If API fails, report will have empty zones
    }

    const zones = dbZones.map((z) => ({
      zone: z,
      visitors: getZoneVisitors(z, hour, dayOfWeek),
    }));

    const params: ReportParams = {
      mallId: resolvedMallId,
      mallName: identity.name,
      colors: {
        primary: identity.colors.primary,
        secondary: identity.colors.secondary,
        accent: identity.colors.accent,
        gradientFrom: identity.gradient.from,
        gradientTo: identity.gradient.to,
      },
      floor: 'ground',
      hour,
      dayOfWeek,
      zones,
      locale: i18n.language,
    };

    if (format === 'pdf') {
      // Try to fetch LLM narrative
      let narrative: { narrative: string; highlights: string[] } | null = null;
      try {
        const res = await fetch('/api/report/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mallName: identity.name,
            floor: 'ground',
            hour,
            zones: zones.map(z => ({
              name: z.zone.nameFi ?? z.zone.name,
              visitors: z.visitors.visitors,
              density: z.visitors.density,
              capacity: z.zone.capacity,
              delta: z.visitors.delta,
            })),
            language: i18n.language,
          }),
        });
        if (res.ok) {
          narrative = await res.json();
        }
      } catch {
        // LLM unavailable — PDF will use fallback
      }

      await generateFlowReportPDF({ ...params, narrative });
    } else {
      // CSV and Excel both download CSV
      generateFlowReportCSV(params);
    }
  }, [resolvedMallId, identity, i18n.language]);

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

  return (
    <>
      <MallLeftNav />
      <MallTopBar onExport={handleExport} />

      <main className="ml-[80px] mt-[80px] h-[calc(100vh-80px)] overflow-auto bg-[#F8F6F3]">
        <div className="p-8 max-w-[1600px] mx-auto">
          <PropertyDetail mallId={mallId} />
        </div>
      </main>
    </>
  );
}
