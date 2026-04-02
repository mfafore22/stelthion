/** Weather shock scenario calculator — demo stub */

export type WeatherCondition = 'heavy_rain' | 'heat_wave' | 'snow' | 'mild';

export function calculateWeatherShock(
  condition: WeatherCondition,
  _mallId: string,
  isFinnish?: boolean
) {
  const lifts: Record<WeatherCondition, number> = {
    heavy_rain: 12,
    heat_wave: -8,
    snow: -15,
    mild: 5,
  };
  const lift = lifts[condition] ?? 0;

  return {
    predicted: {
      footfall: 4820 * (1 + lift / 100),
      footfallLift: lift,
      revenue: 185000 * (1 + lift / 100),
      revenueLift: lift * 0.8,
      conversion: 23.4,
      dwellTime: 47,
    },
    baseline: {
      footfall: 4820,
      revenue: 185000,
      conversion: 23.4,
      dwellTime: 47,
    },
    confidence: {
      level: 'medium' as const,
      factors: ['Historical weather data', 'Seasonal patterns', 'Local demographics'],
    },
    dataSource: {
      name: 'STELTHION SIGNALS',
      apis: ['FMI Open Data', 'Ideapark footfall sensors'],
      baselines: ['Q1–Q4 2024 Ideapark visitor data', 'Finnish retail weather index'],
    },
    scenarioName: `Weather Shock: ${condition.replace('_', ' ')}`,
    scenarioDescription: `Estimated footfall and revenue impact for ${isFinnish ? 'Ideapark Lempäälä' : 'Ideapark Lempäälä'} under ${condition.replace('_', ' ')} conditions.`,
    assumptions: [
      'Historical footfall data from Ideapark 2023–2024',
      'Weather sensitivity derived from Finnish retail benchmarks',
      'Revenue modelled at €38.4 per visitor average basket',
    ],
  };
}
