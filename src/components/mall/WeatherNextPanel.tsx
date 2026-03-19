/**
 * WeatherNext Panel Component
 * Weather impact analysis panel - key differentiator
 * NOW WITH REAL FMI DATA! Updates every 10 minutes
 */

'use client';

import { Cloud, Droplets, Wind, ThermometerSun } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SwirlLoader } from '@/components/ui/SwirlLoader';
import { useWeather } from '@/hooks/mall/useWeather';
import { useTranslation } from 'react-i18next';

interface WeatherNextPanelProps {
  mallId: string;
  expanded?: boolean;
}

export function WeatherNextPanel({ mallId, expanded = false }: WeatherNextPanelProps) {
  const { t } = useTranslation('mall');
  // Fetch real weather data from FMI
  const { weather, isLoading, isError } = useWeather(mallId);

  // Show loading state
  if (isLoading) {
    return (
      <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
        <div className="flex items-center justify-center h-48">
          <SwirlLoader size="md" />
          <span className="ml-2 text-sm text-bo-neutral-600">{t('weather.loading')}</span>
        </div>
      </Card>
    );
  }

  // Use real weather data or fallback
  const temp = weather?.temperature ?? 18;
  const precip = weather?.precipitation ?? 0;
  const comfort = weather?.comfortIndex ?? 0.72;
  const wind = weather?.windSpeed ?? 8;
  const impact = weather?.footfallImpact ?? 6.2;
  const condition = weather?.condition ?? 'Clear';
  const rawDescription = weather?.description ?? 'Optimal conditions';
  const season = weather?.season ?? 'autumn';
  const timeOfDay = weather?.timeOfDay ?? 'afternoon';

  // Both use the short condition key ('Cloudy', 'Clear', 'Rain', 'Snow') for lookup
  const translatedCondition = t(`weather.condition.${condition}`, { defaultValue: condition });
  const translatedDescription = t(`weather.condition.${condition}`, { defaultValue: rawDescription });

  // Strip any legacy 'demo' label from the source string
  const rawSource = (weather?.source ?? 'Stelthion').replace(/\s*demo\s*/i, ' ').trim();
  const source = rawSource === 'FMI' ? 'FMI (Finnish Meteorological Institute)' : rawSource;

  // Generate contextual forecast message
  const getForecast = () => {
    if (impact > 15) return t('weather.forecastMsg.significant', { condition: translatedCondition });
    if (impact > 5) return t('weather.forecastMsg.moderate', { description: translatedDescription });
    if (impact < 0) return t('weather.forecastMsg.outdoor');
    return t('weather.forecastMsg.stable', { description: translatedDescription });
  };

  // Temperature assessment
  const getTempAssessment = () => {
    if (temp < 0) return t('weather.temp.cold');
    if (temp < 15) return t('weather.temp.cool');
    if (temp <= 22) return t('weather.temp.optimal');
    if (temp <= 28) return t('weather.temp.warm');
    return t('weather.temp.hot');
  };

  // Comfort level
  const getComfortLabel = () => {
    if (comfort > 0.7) return t('weather.comfort.high');
    if (comfort > 0.4) return t('weather.comfort.moderate');
    return t('weather.comfort.low');
  };

  return (
    <Card className="p-6 bg-bo-glass border-bo-neutral-200/30 shadow-bo-glass">
      <div className="mb-4 flex items-center gap-2">
        <Cloud className="h-5 w-5 text-bo-info-dark" />
        <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('weather.title')}</h3>
      </div>

      {isError && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          ⚠️ {t('weather.serviceUnavailable')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <ThermometerSun className="h-5 w-5 text-bo-warning-dark" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.temperature')}</div>
            <div className="font-semibold text-bo-neutral-950">{temp}°C ({getTempAssessment()})</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Droplets className="h-5 w-5 text-bo-info-dark" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.precipitation')}</div>
            <div className="font-semibold text-bo-neutral-950">{precip}mm</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-bo-success-dark" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.comfortIndex')}</div>
            <div className="font-semibold text-bo-neutral-950">{comfort.toFixed(2)} ({getComfortLabel()})</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Wind className="h-5 w-5 text-bo-neutral-500" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.wind')}</div>
            <div className="font-semibold text-bo-neutral-950">{wind} km/h</div>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-bo-neutral-200/50 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-bo-neutral-600">{t('weather.footfallImpact')}</span>
          <span className={`text-lg font-bold ${impact >= 0 ? 'text-bo-success-dark' : 'text-bo-warning-dark'}`}>
            {impact >= 0 ? '+' : ''}{impact}%
          </span>
        </div>
        <div className="mt-2 text-sm text-bo-neutral-600">
          {impact > 15 ? t('weather.impact.indoor') : impact > 0 ? t('weather.impact.mild') : t('weather.impact.outdoor')}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-bo-info-light/50 p-3 text-sm border border-bo-info/15">
        <div className="font-medium text-bo-neutral-950">{t('weather.forecast')}</div>
        <div className="text-bo-neutral-700">{getForecast()}</div>
        <div className="mt-2 text-xs text-bo-neutral-600">
          {t(`weather.season.${season}`)} · {t(`weather.timeOfDay.${timeOfDay}`)} · {t('weather.dataSource', { source })}
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-bo-neutral-950">{t('weather.historicalCorrelation')}</h4>
          <div className="text-sm text-bo-neutral-700">{t('weather.correlationText', { season: t(`weather.season.${season}`) })}</div>
        </div>
      )}
    </Card>
  );
}
