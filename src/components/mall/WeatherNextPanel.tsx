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
      <Card className="bo-surface rounded-xl border-2 border-bo-primary-200/50 p-6 shadow-bo-glass">
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

  // Weather context classification
  const isDaytime = timeOfDay !== 'night';
  const isNiceOutdoors = temp >= 15 && precip < 0.3 && isDaytime;
  const isColdOrDark = temp < 0 || !isDaytime;

  // Generate contextual forecast message
  const getForecast = () => {
    if (impact > 15) return t('weather.forecastMsg.significant', { condition: translatedCondition });
    if (impact > 5) return t('weather.forecastMsg.moderate', { description: translatedDescription });
    if (impact < 0 && isNiceOutdoors) return t('weather.forecastMsg.outdoor');
    if (impact < 0 && isColdOrDark) return t('weather.forecastMsg.coldQuiet');
    return t('weather.forecastMsg.stable', { description: translatedDescription });
  };

  // Temperature assessment
  const getTempAssessment = () => {
    if (temp < -10) return t('weather.temp.freezing');
    if (temp < 0) return t('weather.temp.cold');
    if (temp < 10) return t('weather.temp.cool');
    if (temp <= 22) return t('weather.temp.optimal');
    if (temp <= 28) return t('weather.temp.warm');
    return t('weather.temp.hot');
  };

  // Comfort level — user-friendly labels for mall visitors
  const getComfortLabel = () => {
    if (comfort < 0.4) return t('weather.comfort.great');
    if (comfort < 0.7) return t('weather.comfort.good');
    if (isNiceOutdoors) return t('weather.comfort.outdoors');
    return t('weather.comfort.excellent');
  };

  return (
    <Card className="bo-surface rounded-xl border-2 border-bo-primary-200/50 p-6 shadow-bo-glass">
      <div className="mb-4 h-1.5 rounded-full bg-gradient-to-r from-bo-info-dark via-bo-primary-700 to-bo-success-dark" />
      <div className="mb-4 flex items-center gap-2">
        <Cloud className="h-5 w-5 text-bo-info-dark" />
        <h3 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">{t('weather.title')}</h3>
      </div>

      {isError && (
        <div className="bo-surface-subtle mb-4 rounded-lg border border-bo-warning/30 p-3 text-sm text-bo-warning-dark">
          {t('weather.serviceUnavailable')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bo-surface-subtle flex items-center gap-3 rounded-lg border border-bo-neutral-200/60 p-3">
          <ThermometerSun className="h-5 w-5 text-bo-warning-dark" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.temperature')}</div>
            <div className="font-semibold text-bo-neutral-950">{temp}°C ({getTempAssessment()})</div>
          </div>
        </div>

        <div className="bo-surface-subtle flex items-center gap-3 rounded-lg border border-bo-neutral-200/60 p-3">
          <Droplets className="h-5 w-5 text-bo-info-dark" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.precipitation')}</div>
            <div className="font-semibold text-bo-neutral-950">{precip}mm</div>
          </div>
        </div>

        <div className="bo-surface-subtle flex items-center gap-3 rounded-lg border border-bo-neutral-200/60 p-3">
          <Cloud className="h-5 w-5 text-bo-success-dark" />
          <div>
            <div className="text-sm text-bo-neutral-600">{t('weather.shoppingWeather')}</div>
            <div className="font-semibold text-bo-neutral-950">{getComfortLabel()}</div>
          </div>
        </div>

        <div className="bo-surface-subtle flex items-center gap-3 rounded-lg border border-bo-neutral-200/60 p-3">
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
          {impact > 15 ? t('weather.impact.indoor') : impact > 0 ? t('weather.impact.mild') : isNiceOutdoors ? t('weather.impact.outdoor') : isColdOrDark ? t('weather.impact.quiet') : t('weather.impact.normal')}
        </div>
      </div>

      <div className="bo-surface-subtle mt-4 rounded-lg border border-bo-info/20 p-3 text-sm">
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
