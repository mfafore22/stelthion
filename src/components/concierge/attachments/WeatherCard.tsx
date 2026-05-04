'use client';

import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Wind, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AttachmentShell } from './AttachmentShell';

interface WeatherCardProps {
  data: unknown;
  title: string;
}

const CONDITION_ICONS: Record<string, React.ElementType> = {
  'Clear': Sun,
  'Partly Cloudy': Cloud,
  'Cloudy': Cloud,
  'Overcast': Cloud,
  'Rain': CloudRain,
  'Heavy Rain': CloudRain,
  'Snow': CloudSnow,
  'Sleet': CloudDrizzle,
};

export function WeatherCard({ data, title }: WeatherCardProps) {
  const { t, i18n } = useTranslation('mall');
  if (!data) return null;

  const localizedCondition = (c?: string) =>
    c ? t(`concierge.attachments.weather.conditions.${c}`, { defaultValue: c }) : '';
  const timeLocale = i18n.language === 'fi' ? 'fi-FI' : i18n.language === 'sv' ? 'sv-SE' : 'en-GB';

  // Single observation
  if (!Array.isArray(data)) {
    const d = data as {
      temperature?: number;
      condition?: string;
      windSpeedKmh?: number;
      humidity?: number;
      precipitation1h?: number;
    };

    const Icon = CONDITION_ICONS[d.condition || ''] || Cloud;

    return (
      <AttachmentShell title={title} tone="blue">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-bo-primary-500 flex-shrink-0" />
          <div>
            <div className="text-lg font-semibold text-bo-neutral-950">{d.temperature}°C</div>
            <div className="text-xs text-bo-neutral-600">{localizedCondition(d.condition)}</div>
          </div>
          <div className="ml-auto text-right text-xs text-bo-neutral-500 space-y-0.5">
            <div className="flex items-center gap-1 justify-end">
              <Wind className="h-3 w-3" /> {d.windSpeedKmh} km/h
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Droplets className="h-3 w-3" /> {d.humidity}%
            </div>
          </div>
        </div>
      </AttachmentShell>
    );
  }

  // Forecast array
  const forecast = (data as Array<{ time: string; temperature: number; condition: string }>).slice(0, 6);

  return (
    <AttachmentShell title={title} tone="blue">
      <div className="flex gap-2 overflow-x-auto">
        {forecast.map((f, i) => {
          const Icon = CONDITION_ICONS[f.condition] || Cloud;
          const time = new Date(f.time).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[48px]" title={localizedCondition(f.condition)}>
              <span className="text-[10px] text-bo-neutral-500">{time}</span>
              <Icon className="h-4 w-4 text-bo-neutral-600" />
              <span className="text-xs font-medium text-bo-neutral-900">{f.temperature}°</span>
            </div>
          );
        })}
      </div>
    </AttachmentShell>
  );
}
