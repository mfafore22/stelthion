/**
 * Floor Heatmap Component
 * Visual zone-level performance with weather ingress hotspots
 * Now with REAL FMI weather data for accurate weather boost calculations
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMallIdentity } from '@/hooks/mall/useMallIdentity';
import { useWeather } from '@/hooks/mall/useWeather';

interface FloorHeatmapProps {
  mallId: string;
  showPredicted?: boolean;
  selectedTime?: string;
}

interface Zone {
  id: string;
  name: string;
  category: string;
  visitors: number;
  predicted: number;
  delta: number;
  weatherBoost: number;
  campaign?: string;
  position: { x: number; y: number; width: number; height: number };
}

const ZONES: Zone[] = [
  {
    id: 'fashion-a',
    name: 'Fashion Zone A',
    category: 'Fashion',
    visitors: 12450,
    predicted: 11200,
    delta: 12,
    weatherBoost: 6,
    campaign: 'Autumn Promo',
    position: { x: 50, y: 100, width: 200, height: 150 },
  },
  {
    id: 'grocery-b',
    name: 'Grocery Zone B',
    category: 'Grocery',
    visitors: 9870,
    predicted: 9300,
    delta: 6,
    weatherBoost: 3,
    position: { x: 300, y: 100, width: 200, height: 150 },
  },
  {
    id: 'fnb-court',
    name: 'F&B Court',
    category: 'F&B',
    visitors: 8920,
    predicted: 8250,
    delta: 8,
    weatherBoost: 4,
    position: { x: 550, y: 100, width: 200, height: 150 },
  },
];

export function FloorHeatmap({ mallId, showPredicted = false, selectedTime = '14:00' }: FloorHeatmapProps) {
  const identity = useMallIdentity(mallId);
  const { weather } = useWeather(mallId); // Fetch real FMI weather data
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [showWeatherIngress, setShowWeatherIngress] = useState(true);
  const [showDirectionalFlow, setShowDirectionalFlow] = useState(true);
  const [timeSlider, setTimeSlider] = useState(14);

  // Calculate weather boost from real FMI data
  const realWeatherBoost = weather?.footfallImpact ?? 0;
  const weatherCondition = weather?.condition ?? 'Clear';
  const weatherDescription = weather?.description ?? 'Normal conditions';

  const getHeatColor = (delta: number) => {
    if (delta >= 10) return 'bg-red-500/70 border-red-600';
    if (delta >= 5) return 'bg-yellow-500/70 border-yellow-600';
    return 'bg-green-500/70 border-green-600';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: identity.colors.primary }}>
          Floor Heatmap
        </h1>
        <p className="text-muted-foreground">{identity.name} - Level 1</p>
      </div>

      {/* Controls */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Metric:</span>
            <select className="rounded-md border bg-background px-3 py-2 text-sm">
              <option>Footfall</option>
              <option>Dwell Time</option>
              <option>Conversion</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <select className="rounded-md border bg-background px-3 py-2 text-sm">
              <option>All</option>
              <option>Fashion</option>
              <option>F&B</option>
              <option>Grocery</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="weather-ingress"
              checked={showWeatherIngress}
              onChange={(e) => setShowWeatherIngress(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="weather-ingress" className="text-sm font-medium">
              Show weather ingress hotspots
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="directional-flow"
              checked={showDirectionalFlow}
              onChange={(e) => setShowDirectionalFlow(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="directional-flow" className="text-sm font-medium">
              Show directional flow arrows
            </label>
          </div>
        </div>

        {/* Time Scrubber */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Time:</span>
            <span className="font-semibold">{timeSlider}:00</span>
          </div>
          <input
            type="range"
            min="10"
            max="21"
            value={timeSlider}
            onChange={(e) => setTimeSlider(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>10:00</span>
            <span>15:00</span>
            <span>21:00</span>
          </div>
        </div>
      </Card>

      {/* Floorplan */}
      <Card className="p-6">
        <div className="relative h-[600px] w-full rounded-lg bg-muted/30">
          <div className="absolute inset-0">
            {/* Legend */}
            <div className="absolute right-4 top-4 space-y-2 rounded-md bg-card p-3 shadow-md">
              <div className="text-sm font-semibold">Performance</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded border-2 border-red-600 bg-red-500/70" />
                <span>High (+10%)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded border-2 border-yellow-600 bg-yellow-500/70" />
                <span>Medium (+5%)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded border-2 border-green-600 bg-green-500/70" />
                <span>Low (&lt;5%)</span>
              </div>
            </div>

            {/* Weather Ingress Indicator - REAL FMI DATA */}
            {showWeatherIngress && (
              <div className="absolute left-4 top-4 rounded-md bg-blue-50 p-3 text-sm shadow-md dark:bg-blue-950">
                <div className="font-medium text-blue-600">
                  {weatherCondition === 'Rain' ? '🌧️' : weatherCondition === 'Snow' ? '❄️' : weatherCondition === 'Clear' ? '☀️' : '☁️'} Weather Impact
                </div>
                <div className="text-muted-foreground">
                  {realWeatherBoost >= 0 ? `+${realWeatherBoost.toFixed(1)}%` : `${realWeatherBoost.toFixed(1)}%`} boost · {weatherDescription}
                </div>
                <div className="text-xs text-muted-foreground mt-1">FMI real-time data</div>
              </div>
            )}

            {/* Zones */}
            {ZONES.map((zone) => (
              <div
                key={zone.id}
                className={cn(
                  'absolute cursor-pointer rounded-lg border-2 transition-all',
                  getHeatColor(zone.delta),
                  hoveredZone === zone.id && 'scale-105 shadow-lg'
                )}
                style={{
                  left: zone.position.x,
                  top: zone.position.y,
                  width: zone.position.width,
                  height: zone.position.height,
                }}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                  <div className="text-sm font-semibold text-white drop-shadow-lg">{zone.name}</div>
                  <div className="mt-2 text-2xl font-bold text-white drop-shadow-lg">
                    {formatNumber(zone.visitors)}
                  </div>
                  <div className="mt-1 text-xs text-white drop-shadow-lg">+{zone.delta}% vs plan</div>
                  {zone.campaign && (
                    <div className="mt-2 rounded-full bg-purple-600 px-2 py-1 text-xs font-medium text-white">
                      🎯 {zone.campaign}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Directional Flow Arrows (Based on Manual Counts Nov 14-15) */}
            {showDirectionalFlow && (
              <>
                {/* Railway Plaza to Mall - 57% inbound flow */}
                <div className="absolute" style={{ left: 100, top: 300 }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-semibold text-blue-900 bg-blue-100 px-2 py-1 rounded mb-1">
                      Railway Plaza
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-bold text-blue-600">→</div>
                      <div className="text-xs text-blue-700">57%</div>
                    </div>
                    <svg width="120" height="40" className="overflow-visible">
                      {/* Thick arrow showing dominant flow */}
                      <defs>
                        <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#2563eb" />
                        </marker>
                      </defs>
                      <path d="M 10 20 L 110 20" stroke="#2563eb" strokeWidth="4" markerEnd="url(#arrowhead-blue)" />
                    </svg>
                    <div className="text-xs text-blue-600 mt-1">2,040/hr → Mall</div>
                  </div>
                </div>

                {/* Mall to Railway - 43% outbound flow */}
                <div className="absolute" style={{ left: 100, top: 360 }}>
                  <div className="flex flex-col items-center">
                    <svg width="120" height="40" className="overflow-visible">
                      <defs>
                        <marker id="arrowhead-gray" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                        </marker>
                      </defs>
                      <path d="M 110 20 L 10 20" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead-gray)" />
                    </svg>
                    <div className="text-xs text-gray-600">1,560/hr ← Mall</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="text-sm font-bold text-gray-600">←</div>
                      <div className="text-xs text-gray-700">43%</div>
                    </div>
                  </div>
                </div>

                {/* Central Escalators - DOWN 59% */}
                <div className="absolute" style={{ left: 400, top: 50 }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-semibold text-green-900 bg-green-100 px-2 py-1 rounded mb-1">
                      Escalators
                    </div>
                    <svg width="40" height="80" className="overflow-visible">
                      <defs>
                        <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#16a34a" />
                        </marker>
                      </defs>
                      {/* DOWN arrow (dominant) */}
                      <path d="M 20 10 L 20 70" stroke="#16a34a" strokeWidth="4" markerEnd="url(#arrowhead-green)" />
                    </svg>
                    <div className="text-xs text-green-600 font-bold">↓ 59% DOWN</div>
                    <div className="text-xs text-green-600">to Mall</div>
                  </div>
                </div>

                {/* Central Escalators - UP 41% */}
                <div className="absolute" style={{ left: 450, top: 50 }}>
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">from Mall</div>
                    <div className="text-xs text-gray-600 font-bold">↑ 41% UP</div>
                    <svg width="40" height="80" className="overflow-visible">
                      <defs>
                        <marker id="arrowhead-gray-up" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                        </marker>
                      </defs>
                      {/* UP arrow (smaller) */}
                      <path d="M 20 70 L 20 10" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead-gray-up)" />
                    </svg>
                  </div>
                </div>

                {/* Flow Legend */}
                <div className="absolute right-4 bottom-4 bg-white p-3 rounded-lg shadow-md border">
                  <div className="text-xs font-semibold mb-2">Directional Flow</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-blue-600"></div>
                      <span>Railway → Mall (dominant)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-green-600"></div>
                      <span>Escalator DOWN (59%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-gray-500"></div>
                      <span>Return flow</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                    Based on manual counts Nov 14-15, 2024
                  </div>
                </div>
              </>
            )}

            {/* Hover Tooltip */}
            {hoveredZone && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-card p-4 shadow-lg">
                {(() => {
                  const zone = ZONES.find((z) => z.id === hoveredZone);
                  if (!zone) return null;
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold">{zone.name}</div>
                      <div className="flex justify-between gap-8">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-medium">{formatNumber(zone.visitors)} visitors</span>
                      </div>
                      {showPredicted && (
                        <div className="flex justify-between gap-8">
                          <span className="text-muted-foreground">Predicted:</span>
                          <span className="font-medium">{formatNumber(zone.predicted)}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-8">
                        <span className="text-muted-foreground">Weather boost (FMI):</span>
                        <span className="font-medium text-blue-600">
                          {realWeatherBoost >= 0 ? '+' : ''}{realWeatherBoost.toFixed(1)}%
                        </span>
                      </div>
                      {zone.campaign && (
                        <div className="flex justify-between gap-8">
                          <span className="text-muted-foreground">Campaign:</span>
                          <span className="font-medium text-purple-600">{zone.campaign}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
