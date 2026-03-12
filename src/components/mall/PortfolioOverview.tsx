/**
 * Portfolio Overview Component
 * Ideapark Lempäälä property overview
 */

'use client';

import React, { useState } from 'react';
import { MallHeader } from './MallHeader';
import { PortfolioKPIs } from './PortfolioKPIs';
import { MallCard } from './MallCard';
import { PortfolioMap } from './PortfolioMap';

// Ideapark Portfolio Data
const IDEAPARK_MALLS = [
  {
    id: 'ideapark',
    name: 'Ideapark Lempäälä',
    city: 'Lempäälä',
    annualVisitors: 4500000,
    annualSales: 185000000,
    currentVisitors: 4820,
    deltaVsPlan: 8.7,
    weatherImpact: 3.2,
    alerts: { critical: 0, warning: 0, message: 'No alerts' },
    nearestRival: { name: 'Ideapark Oulu', footfallDelta: 0, dwellDelta: 0 },
    status: 'LIVE',
    coordinates: { lat: 61.316, lng: 23.757 },
  },
];

export function PortfolioOverview() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [showPredicted, setShowPredicted] = useState(false);
  const [showCatchment, setShowCatchment] = useState(false);
  const [selectedMall, setSelectedMall] = useState<string | null>(null);

  // Calculate portfolio-level KPIs
  const totalVisitors = IDEAPARK_MALLS.reduce((sum, mall) => sum + mall.currentVisitors, 0);
  const avgDelta = IDEAPARK_MALLS.reduce((sum, mall) => sum + mall.deltaVsPlan, 0) / IDEAPARK_MALLS.length;
  const avgWeatherImpact = IDEAPARK_MALLS.reduce((sum, mall) => sum + mall.weatherImpact, 0) / IDEAPARK_MALLS.length;
  const totalAlerts = IDEAPARK_MALLS.reduce(
    (acc, mall) => ({
      critical: acc.critical + mall.alerts.critical,
      warning: acc.warning + mall.alerts.warning,
    }),
    { critical: 0, warning: 0 }
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Global Header */}
      <MallHeader
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        showPredicted={showPredicted}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        onToggleChange={setShowPredicted}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: KPIs and Mall Cards */}
        <div className="flex w-2/3 flex-col overflow-auto p-6">
          {/* Portfolio KPIs */}
          <PortfolioKPIs
            totalVisitors={totalVisitors}
            yoyDelta={avgDelta}
            weatherImpact={avgWeatherImpact}
            alerts={totalAlerts}
            comfortIndex={0.72}
          />

          {/* Mall Cards */}
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">Portfolio Properties</h2>
            <div className="grid gap-4">
              {IDEAPARK_MALLS.map((mall) => (
                <MallCard
                  key={mall.id}
                  mall={mall}
                  onSelect={() => setSelectedMall(mall.id)}
                  isSelected={selectedMall === mall.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Map View */}
        <div className="w-1/3 border-l bg-muted/30 p-6">
          <PortfolioMap
            malls={IDEAPARK_MALLS}
            selectedMall={selectedMall}
            showCatchment={showCatchment}
            onMallSelect={setSelectedMall}
            onCatchmentToggle={setShowCatchment}
          />
        </div>
      </div>
    </div>
  );
}
