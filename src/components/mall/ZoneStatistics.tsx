/**
 * Zone Statistics Component
 * Displays detailed statistics for a selected catchment zone
 */

'use client';

import React from 'react';
import { MallCard } from './ui/MallCard';
import { Users, Euro, Briefcase, Home, MapPin } from 'lucide-react';
import type { CatchmentDemographics } from '@/lib/types/transport';

interface ZoneStatisticsProps {
  zone: CatchmentDemographics['zones'][0];
  zoneIndex: number;
}

export function ZoneStatistics({ zone, zoneIndex }: ZoneStatisticsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return `€${formatNumber(num)}`;
  };

  // Zone colors matching the map
  const zoneColors = {
    5: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    10: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    15: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    30: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const colors = zoneColors[zone.driveTimeMinutes as keyof typeof zoneColors] || zoneColors[5];

  return (
    <MallCard variant="glass">
      <div className="space-y-6">
        {/* Zone Header */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
          <MapPin className={`h-6 w-6 ${colors.text}`} />
          <div>
            <h3 className="text-xl font-bold text-bo-neutral-950">
              {zone.driveTimeMinutes}-Minute Drive Zone
            </h3>
            <p className="text-sm text-bo-neutral-600">
              {zone.postalCodes.length} postal codes
            </p>
          </div>
        </div>

        {/* Postal Codes */}
        <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
          <div className="flex items-center gap-2 mb-3">
            <Home className="h-4 w-4 text-bo-neutral-600" />
            <span className="text-sm font-medium text-bo-neutral-700">Postal Codes Included</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {zone.postalCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-bo-neutral-100 text-bo-neutral-700 border border-bo-neutral-300"
              >
                {code}
              </span>
            ))}
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
                {formatNumber(zone.population.total)}
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Households</div>
              <div className="text-2xl font-bold text-bo-primary-700">
                {formatNumber(zone.population.households)}
              </div>
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
          <div className="text-sm font-medium text-bo-neutral-700 mb-4">Age Distribution</div>
          <div className="space-y-3">
            {Object.entries(zone.population.ageGroups).map(([ageGroup, count]) => {
              const percentage = (count / zone.population.total) * 100;
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
                {formatCurrency(zone.income.medianHouseholdIncome)}
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Avg Disposable</div>
              <div className="text-lg font-bold text-bo-success-dark">
                {formatCurrency(zone.income.averageDisposableIncome)}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-bo-success/15">
            <div className="text-xs text-bo-neutral-600 mb-2">High Income Share (&gt;€60k/year)</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-bo-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bo-success-dark rounded-full transition-all duration-300"
                  style={{ width: `${zone.income.highIncomeShare}%` }}
                />
              </div>
              <span className="text-sm font-bold text-bo-success-dark">
                {zone.income.highIncomeShare}%
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
                {zone.employment.employmentRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600 mb-1">Students</div>
              <div className="text-xl font-bold text-bo-info-dark">
                {formatNumber(zone.employment.students)}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-bo-info/15">
            <div className="text-xs text-bo-neutral-600 mb-1">Top Employment Sectors</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {zone.employment.topSectors.map((sector) => (
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
      </div>
    </MallCard>
  );
}
