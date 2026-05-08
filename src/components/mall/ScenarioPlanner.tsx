/**
 * Scenario Planner Component
 * What-if modeling with weather, campaigns, and operational changes
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, Copy } from 'lucide-react';
import { useMallIdentity } from '@/hooks/mall/useMallIdentity';

interface ScenarioPlannerProps {
  mallId: string;
}

interface ScenarioResult {
  mall: string;
  baselineVisitors: number;
  predictedVisitors: number;
  delta: number;
  revenue: number;
  staffing: number;
  parking: number;
}

const CAMPAIGN_PRESETS = [
  { id: 'blackfriday', name: 'Black Friday', uplift: 35 },
  { id: 'christmas', name: 'Christmas Shopping', uplift: 28 },
  { id: 'summer', name: 'Summer Sale', uplift: 18 },
  { id: 'easter', name: 'Easter Campaign', uplift: 12 },
];

export function ScenarioPlanner({ mallId }: ScenarioPlannerProps) {
  const identity = useMallIdentity(mallId);
  const [selectedMalls, setSelectedMalls] = useState<string[]>([mallId]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weatherCondition, setWeatherCondition] = useState('optimal');
  const [campaignPreset, setCampaignPreset] = useState('');
  const [customUplift, setCustomUplift] = useState(10);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runScenario = async () => {
    setIsRunning(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock results
    const baseVisitors = 38240;
    const weatherImpact = weatherCondition === 'optimal' ? 1.06 : weatherCondition === 'poor' ? 0.92 : 1.0;
    const campaignImpact = campaignPreset
      ? 1 + CAMPAIGN_PRESETS.find((p) => p.id === campaignPreset)!.uplift / 100
      : 1 + customUplift / 100;

    const predicted = Math.round(baseVisitors * weatherImpact * campaignImpact);
    const delta = ((predicted - baseVisitors) / baseVisitors) * 100;

    setResults([
      {
        mall: 'Ideapark Lempäälä',
        baselineVisitors: baseVisitors,
        predictedVisitors: predicted,
        delta,
        revenue: Math.round(predicted * 8.94), // €8.94 avg per visitor
        staffing: Math.round(predicted / 500), // 1 staff per 500 visitors
        parking: Math.round((predicted / baseVisitors) * 87), // Current 87% utilization
      },
    ]);

    setIsRunning(false);
  };

  const exportPDF = () => {
    console.log('Exporting PDF...');
    // TODO: Implement PDF export
  };

  const copyAPI = () => {
    const apiEndpoint = `curl -X POST https://api.stelthion.com/v1/scenarios \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mall_id": "${mallId}",
    "date": "${selectedDate}",
    "weather": "${weatherCondition}",
    "campaign_uplift": ${customUplift}
  }'`;

    navigator.clipboard.writeText(apiEndpoint);
    alert('API endpoint copied to clipboard!');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: identity.colors.primary }}>
          Scenario Planner
        </h1>
        <p className="text-muted-foreground">Model impact of weather, campaigns, and operational changes</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="col-span-1 space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Scenario Inputs</h2>

            {/* Mall Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Select Malls</label>
              <select
                multiple
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={selectedMalls}
                onChange={(e) =>
                  setSelectedMalls(Array.from(e.target.selectedOptions, (option) => option.value))
                }
              >
                <option value="ideapark-lempaala">Ideapark Lempäälä</option>
              </select>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Weather Condition */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Weather Condition</label>
              <select
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="optimal">Optimal (18°C, sunny)</option>
                <option value="good">Good (15°C, partly cloudy)</option>
                <option value="poor">Poor (8°C, heavy rain)</option>
                <option value="extreme">Extreme (snow storm)</option>
              </select>
            </div>

            {/* Campaign Preset */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Campaign Preset</label>
              <select
                value={campaignPreset}
                onChange={(e) => setCampaignPreset(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Custom (use slider below)</option>
                {CAMPAIGN_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} (+{preset.uplift}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Uplift */}
            {!campaignPreset && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Custom Uplift: {customUplift}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={customUplift}
                  onChange={(e) => setCustomUplift(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Run Button */}
            <Button
              onClick={runScenario}
              disabled={isRunning}
              className="w-full gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running Scenario...' : 'Run Scenario'}
            </Button>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="col-span-2 space-y-4">
          {results.length === 0 ? (
            <Card className="flex h-[600px] items-center justify-center p-6">
              <div className="text-center">
                <div className="mb-4 text-4xl">📊</div>
                <div className="text-lg font-semibold text-muted-foreground">
                  Configure scenario inputs and click "Run Scenario" to see results
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Results Summary */}
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Scenario Results</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyAPI} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy API
                    </Button>
                  </div>
                </div>

                {results.map((result, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Predicted Impact</div>
                        <div className="text-3xl font-bold">
                          {formatNumber(result.predictedVisitors)} visitors
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Change from Baseline</div>
                        <div
                          className={`text-3xl font-bold ${
                            result.delta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatPercent(result.delta)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Revenue Impact</div>
                        <div className="mt-2 text-2xl font-bold">
                          €{(result.revenue / 1000).toFixed(0)}k
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Staffing Need</div>
                        <div className="mt-2 text-2xl font-bold">{result.staffing} staff</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Parking Utilization</div>
                        <div className="mt-2 text-2xl font-bold">{result.parking}%</div>
                      </Card>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Detailed Breakdown */}
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Per-Mall Breakdown</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Mall</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Baseline</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Predicted</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Delta</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 font-medium">{result.mall}</td>
                        <td className="py-3 text-right">{formatNumber(result.baselineVisitors)}</td>
                        <td className="py-3 text-right">{formatNumber(result.predictedVisitors)}</td>
                        <td
                          className={`py-3 text-right font-semibold ${
                            result.delta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatPercent(result.delta)}
                        </td>
                        <td className="py-3 text-right">€{formatNumber(result.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
