'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MacroTile, type MacroTileData } from './MacroTile';

interface Response {
  country: string;
  indicators: MacroTileData[];
}

export function MacroDashboard({ country }: { country: string }) {
  const { t, i18n } = useTranslation('mall');
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/shoppermind/macro?country=${encodeURIComponent(country)}&lang=${i18n.language}`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country, i18n.language]);

  if (loading) {
    return (
      <div className="text-xs text-bo-neutral-400 animate-pulse">{t('shoppermind.macro.loading')}</div>
    );
  }
  if (!data || data.indicators.length === 0) return null;
  const hasAnyData = data.indicators.some((i) => i.latestValue != null);
  if (!hasAnyData) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-bo-neutral-950 uppercase tracking-wider mb-3">
        {t('shoppermind.macro.title')}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.indicators.map((ind) => (
          <MacroTile key={ind.code} data={ind} />
        ))}
      </div>
    </section>
  );
}
