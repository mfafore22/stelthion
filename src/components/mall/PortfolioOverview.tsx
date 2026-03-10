/**
 * Portfolio Overview Component
 * Main landing page showing Realidea's 15-mall portfolio
 * Week 3-4 implementation
 */

'use client';

import React, { useState } from 'react';
import { MallHeader } from './MallHeader';
import { PortfolioKPIs } from './PortfolioKPIs';
import { MallCard } from './MallCard';
import { PortfolioMap } from './PortfolioMap';

// Realidea Portfolio Data
const REALIDEA_MALLS = [
  {
    id: 'tripla',
    name: 'Mall of Tripla',
    city: 'Helsinki',
    annualVisitors: 27300000,
    annualSales: 342000000,
    currentVisitors: 38240,
    deltaVsPlan: 8.3,
    weatherImpact: 6.2,
    alerts: { critical: 0, warning: 1, message: 'Parking 87% capacity' },
    nearestRival: { name: 'Kamppi', footfallDelta: 6, dwellDelta: -2 },
    status: 'LIVE',
    coordinates: { lat: 60.1995, lng: 24.9318 },
  },
  {
    id: 'sello',
    name: 'Sello',
    city: 'Espoo',
    annualVisitors: 22600000,
    annualSales: 407500000,
    currentVisitors: 42180,
    deltaVsPlan: 5.1,
    weatherImpact: 3.4,
    alerts: { critical: 0, warning: 0, message: 'No alerts' },
    nearestRival: { name: 'Iso Omena', footfallDelta: 4, dwellDelta: 8 },
    status: 'ALPHA',
    coordinates: { lat: 60.2176, lng: 24.8097 },
  },
  {
    id: 'kamppi',
    name: 'Kamppi Helsinki',
    city: 'Helsinki',
    annualVisitors: 24800000,
    annualSales: 215800000,
    currentVisitors: 36890,
    deltaVsPlan: 7.2,
    weatherImpact: 5.1,
    alerts: { critical: 0, warning: 0, message: 'No alerts' },
    nearestRival: { name: 'Forum', footfallDelta: 12, dwellDelta: 3 },
    status: 'BETA',
    coordinates: { lat: 60.1687, lng: 24.9320 },
  },
  {
    id: 'isoomena',
    name: 'Iso Omena',
    city: 'Espoo',
    annualVisitors: 16100000,
    annualSales: 405400000,
    currentVisitors: 28430,
    deltaVsPlan: 4.8,
    weatherImpact: 2.9,
    alerts: { critical: 0, warning: 1, message: 'HVAC Zone 3 alert' },
    nearestRival: { name: 'Sello', footfallDelta: -4, dwellDelta: -8 },
    status: 'ALPHA',
    coordinates: { lat: 60.1615, lng: 24.7385 },
  },
  {
    id: 'itis',
    name: 'Itis',
    city: 'Helsinki',
    annualVisitors: 15000000,
    annualSales: 260000000,
    currentVisitors: 26450,
    deltaVsPlan: 6.5,
    weatherImpact: 4.2,
    alerts: { critical: 0, warning: 0, message: 'No alerts' },
    nearestRival: { name: 'Tripla', footfallDelta: -5, dwellDelta: 2 },
    status: 'ALPHA',
    coordinates: { lat: 60.2104, lng: 25.0808 },
  },
  {
    id: 'citycenter',
    name: 'Citycenter',
    city: 'Helsinki',
    annualVisitors: 13300000,
    annualSales: 91400000,
    currentVisitors: 23420,
    deltaVsPlan: 5.9,
    weatherImpact: 3.8,
    alerts: { critical: 0, warning: 0, message: 'No alerts' },
    nearestRival: { name: 'Kamppi', footfallDelta: -8, dwellDelta: 1 },
    status: 'BETA',
    coordinates: { lat: 60.1695, lng: 24.9414 },
  },
  {
    id: 'jumbo',
    name: 'Jumbo-Flamingo',
    city: 'Vantaa',
    annualVisitors: 12100000,
    annualSales: 508500000,
    currentVisitors: 21340,
    deltaVsPlan: 3.2,
    weatherImpact: 2.1,
    alerts: { critical: 0, warning: 0, message: 'No alerts' },
    nearestRival: { name: 'Tripla', footfallDelta: -12, dwellDelta: -3 },
    status: 'PLANNED',
    coordinates: { lat: 60.2924, lng: 25.0821 },
  },
];

export function PortfolioOverview() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [showPredicted, setShowPredicted] = useState(false);
  const [showCatchment, setShowCatchment] = useState(false);
  const [selectedMall, setSelectedMall] = useState<string | null>(null);

  // Calculate portfolio-level KPIs
  const totalVisitors = REALIDEA_MALLS.reduce((sum, mall) => sum + mall.currentVisitors, 0);
  const avgDelta = REALIDEA_MALLS.reduce((sum, mall) => sum + mall.deltaVsPlan, 0) / REALIDEA_MALLS.length;
  const avgWeatherImpact = REALIDEA_MALLS.reduce((sum, mall) => sum + mall.weatherImpact, 0) / REALIDEA_MALLS.length;
  const totalAlerts = REALIDEA_MALLS.reduce(
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
              {REALIDEA_MALLS.map((mall) => (
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
            malls={REALIDEA_MALLS}
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
