/**
 * Zone Tabs Component
 * Unified tabbed interface for selecting and viewing zone details
 * Combines zone selection with detailed zone statistics
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { Users, Euro, Briefcase, Home, MapPin } from 'lucide-react';
import type { CatchmentDemographics } from '@/lib/types/transport';

interface ZoneTabsProps {
  demographics: CatchmentDemographics;
  selectedZone: number | null;
  onZoneSelect: (zoneIndex: number) => void;
}

export function ZoneTabs({ demographics, selectedZone, onZoneSelect }: ZoneTabsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return `€${formatNumber(num)}`;
  };

  // Zone colors matching the map
  const zoneColors: Record<number, {
    color: string;
    bg: string;
    border: string;
    lightBg: string;
    text: string;
    borderClass: string;
  }> = {
    5: {
      color: '#10b981',
      bg: '#d1fae5',
      border: '#10b981',
      lightBg: 'bg-green-50',
      text: 'text-green-700',
      borderClass: 'border-green-200'
    },
    10: {
      color: '#3b82f6',
      bg: '#dbeafe',
      border: '#3b82f6',
      lightBg: 'bg-blue-50',
      text: 'text-blue-700',
      borderClass: 'border-blue-200'
    },
    15: {
      color: '#f59e0b',
      bg: '#fef3c7',
      border: '#f59e0b',
      lightBg: 'bg-orange-50',
      text: 'text-orange-700',
      borderClass: 'border-orange-200'
    },
    20: {
      color: '#f59e0b',
      bg: '#fef3c7',
      border: '#f59e0b',
      lightBg: 'bg-amber-50',
      text: 'text-amber-700',
      borderClass: 'border-amber-200'
    },
    30: {
      color: '#ef4444',
      bg: '#fee2e2',
      border: '#ef4444',
      lightBg: 'bg-red-50',
      text: 'text-red-700',
      borderClass: 'border-red-200'
    },
  };

  // Helper to safely get zone color config with fallback
  const getZoneConfig = (driveTimeMinutes: number) => {
    return zoneColors[driveTimeMinutes] || zoneColors[5]; // Gray fallback to 5min zone
  };

  // Default to first zone if none selected
  const activeZoneIndex = selectedZone ?? 0;
  const activeZone = demographics.zones[activeZoneIndex];
  const colors = getZoneConfig(activeZone.driveTimeMinutes);

  return (
    <MallCard variant="glass" className="overflow-hidden">
      {/* Tab Headers */}
      <div className="border-b border-bo-neutral-200 bg-bo-neutral-50/50">
        <div className="flex">
          {demographics.zones.map((zone, index) => {
            const zoneConfig = getZoneConfig(zone.driveTimeMinutes);
            const isActive = index === activeZoneIndex;

            return (
              <button
                key={index}
                onClick={() => onZoneSelect(index)}
                className={`flex-1 px-4 py-3 border-b-3 transition-all ${
                  isActive
                    ? 'border-b-3 bg-white'
                    : 'border-b-3 border-transparent hover:bg-bo-neutral-100/50'
                }`}
                style={{
                  borderBottomColor: isActive ? zoneConfig.color : 'transparent',
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zoneConfig.color }}
                    />
                    <span className={`text-sm font-semibold ${isActive ? 'text-bo-neutral-950' : 'text-bo-neutral-600'}`}>
                      {zone.driveTimeMinutes} min
                    </span>
                  </div>
                  <div className="text-xs text-bo-neutral-500">
                    {formatNumber(zone.population.total)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="p-6 space-y-6">
        {/* Zone Header */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${colors.lightBg} ${colors.borderClass}`}>
          <MapPin className={`h-6 w-6 ${colors.text}`} />
          <div>
            <h3 className="text-xl font-bold text-bo-neutral-950">
              {activeZone.driveTimeMinutes}-Minute Drive Zone
            </h3>
            <p className="text-sm text-bo-neutral-600">
              {activeZone.postalCodes.length} postal codes
            </p>
          </div>
        </div>

        {/* Population Overview */}
        <div className="rounded-lg bg-bo-primary-50/50 p-4 border border-bo-primary-200/30">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-bo-primary-600" />
            <span className="text-sm font-medium text-bo-neutral-700">Population</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Total Residents</div>
              <div className="text-2xl font-bold text-bo-primary-700">
                {formatNumber(activeZone.population.total)}
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Households</div>
              <div className="text-2xl font-bold text-bo-primary-700">
                {formatNumber(activeZone.population.households)}
              </div>
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
          <div className="text-sm font-medium text-bo-neutral-700 mb-4">Age Distribution</div>
          <div className="space-y-3">
            {Object.entries(activeZone.population.ageGroups).map(([ageGroup, count]) => {
              const percentage = (count / activeZone.population.total) * 100;
              return (
                <div key={ageGroup}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-bo-neutral-600">{ageGroup} years</span>
                    <span className="text-xs font-medium text-bo-neutral-950">
                      {formatNumber(count)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-bo-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-bo-accent-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Income Profile */}
        <div className="rounded-lg bg-bo-success-light/50 p-4 border border-bo-success/15">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="h-5 w-5 text-bo-success-dark" />
            <span className="text-sm font-medium text-bo-neutral-700">Income Profile</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Median Household</div>
              <div className="text-lg font-bold text-bo-success-dark">
                {formatCurrency(activeZone.income.medianHouseholdIncome)}
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Avg Disposable</div>
              <div className="text-lg font-bold text-bo-success-dark">
                {formatCurrency(activeZone.income.averageDisposableIncome)}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-bo-success/15">
            <div className="text-xs text-bo-neutral-600 mb-2">High Income Share (&gt;€60k/year)</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-bo-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bo-success-dark rounded-full transition-all duration-300"
                  style={{ width: `${activeZone.income.highIncomeShare}%` }}
                />
              </div>
              <span className="text-sm font-bold text-bo-success-dark">
                {activeZone.income.highIncomeShare}%
              </span>
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="rounded-lg bg-bo-info-light/50 p-4 border border-bo-info/15">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-bo-info-dark" />
            <span className="text-sm font-medium text-bo-neutral-700">Employment</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Employment Rate</div>
              <div className="text-xl font-bold text-bo-info-dark">
                {activeZone.employment.employmentRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Students</div>
              <div className="text-xl font-bold text-bo-info-dark">
                {formatNumber(activeZone.employment.students)}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-bo-info/15">
            <div className="text-xs text-bo-neutral-600 mb-1">Top Employment Sectors</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeZone.employment.topSectors.map((sector) => (
                <span
                  key={sector}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bo-info-100 text-bo-info-dark border border-bo-info-300"
                >
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Postal Codes */}
        <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
          <div className="flex items-center gap-2 mb-3">
            <Home className="h-4 w-4 text-bo-neutral-600" />
            <span className="text-sm font-medium text-bo-neutral-700">Postal Codes Included</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeZone.postalCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-bo-neutral-100 text-bo-neutral-700 border border-bo-neutral-300"
              >
                {code}
              </span>
            ))}
          </div>
        </div>

        {/* Data Source Attribution */}
        <div className="pt-4 border-t border-bo-neutral-200 mt-6">
          <p className="text-xs text-bo-neutral-500 leading-relaxed">
            Demographics data: Statistics Finland (Tilastokeskus)<br />
            Postal boundaries: Statistics Finland WFS API
          </p>
        </div>
      </div>
    </MallCard>
  );
}
