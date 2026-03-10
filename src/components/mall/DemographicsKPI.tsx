/**
 * Demographics KPI Component
 * Displays catchment area population, income, and demographic profiles
 */

'use client';

import React, { useState } from 'react';
import { MallCard } from './ui/MallCard';
import { Users, Briefcase, TrendingUp, MapPin, Database, Home, ChevronRight } from 'lucide-react';
import type { CatchmentDemographics } from '@/lib/types/transport';
import { HouseholdDataModal } from './HouseholdDataModal';
import { getHouseholdData } from '@/lib/data/household';

interface DemographicsKPIProps {
  demographics: CatchmentDemographics;
}

export function DemographicsKPI({ demographics }: DemographicsKPIProps) {
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const householdData = getHouseholdData();
  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return `€${formatNumber(num)}`;
  };

  // Profile badge colors - light background with dark text for readability
  const profileColors = {
    'urban-professional': 'bg-bo-info-100 text-bo-info-dark border border-bo-info-300',
    'family-suburban': 'bg-bo-success-light/70 text-bo-success-dark border border-bo-success/30',
    'suburban-families': 'bg-bo-success-light/70 text-bo-success-dark border border-bo-success/30',
    'student': 'bg-bo-accent-100 text-bo-accent-700 border border-bo-accent-300',
    'mixed': 'bg-bo-neutral-200 text-bo-neutral-950 border border-bo-neutral-300',
  };

  // Spending potential color
  const getSpendingColor = (score: number) => {
    if (score >= 75) return 'text-bo-success-dark';
    if (score >= 50) return 'text-bo-warning-dark';
    return 'text-bo-neutral-700';
  };

  const getSpendingBg = (score: number) => {
    if (score >= 75) return 'bg-bo-success-light/70 border-bo-success/15';
    if (score >= 50) return 'bg-bo-warning-light/70 border-bo-warning/15';
    return 'bg-bo-neutral-200/70 border-bo-neutral-300/30';
  };

  // Calculate total catchment population
  const totalPopulation = demographics.zones.reduce((sum, zone) => sum + zone.population.total, 0);

  // Get primary zone (5-min drive)
  const primaryZone = demographics.zones[0];

  return (
    <MallCard variant="glass">
      <div className="space-y-6">
        {/* Header with Profile & Spending Potential */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-2 tracking-tight">
              Catchment Demographics
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${profileColors[demographics.primaryProfile]}`}
            >
              {demographics.primaryProfile.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </span>
          </div>
          <div className={`rounded-lg p-3 border ${getSpendingBg(demographics.spendingPotential)}`}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${getSpendingColor(demographics.spendingPotential)}`} />
              <div>
                <div className={`text-2xl font-bold ${getSpendingColor(demographics.spendingPotential)}`}>
                  {demographics.spendingPotential}
                </div>
                <div className="text-xs text-bo-neutral-600">Spending Index</div>
              </div>
            </div>
            <div className="text-xs text-bo-neutral-600 mt-2">
              0-100 scale based on income
            </div>
          </div>
        </div>

        {/* Total Population */}
        <div className="rounded-lg bg-bo-primary-50/50 p-4 border border-bo-primary-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-bo-primary-600" />
            <span className="text-sm font-medium text-bo-neutral-600">Total Catchment Population</span>
          </div>
          <div className="text-3xl font-bold text-bo-primary-700">
            {formatNumber(totalPopulation)}
          </div>
          <div className="text-xs text-bo-neutral-600 mt-1">
            Across {demographics.zones.length} drive-time zones
          </div>
          <div className="flex items-center gap-1 text-xs text-bo-neutral-500 mt-2">
            <Database className="h-3 w-3" />
            <span>Source: Statistics Finland Census 2024</span>
          </div>
        </div>

        {/* Primary Zone (5-min) Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-bo-neutral-950">
            <MapPin className="h-5 w-5 text-bo-accent-600" />
            <h4 className="font-semibold">Primary Zone ({primaryZone.driveTimeMinutes}-min drive)</h4>
          </div>

          {/* Age Distribution */}
          <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
            <div className="text-sm font-medium text-bo-neutral-700 mb-3">Age Distribution</div>
            <div className="space-y-2">
              {Object.entries(primaryZone.population.ageGroups).map(([ageGroup, count]) => {
                const percentage = (count / primaryZone.population.total) * 100;
                return (
                  <div key={ageGroup}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-bo-neutral-600">{ageGroup} years</span>
                      <span className="text-xs font-medium text-bo-neutral-950">
                        {formatNumber(count)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-bo-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-bo-accent-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1 text-xs text-bo-neutral-500 mt-3 pt-3 border-t border-bo-neutral-200/30">
              <Database className="h-3 w-3" />
              <span>Source: Statistics Finland Population Register 2024</span>
            </div>
          </div>

          {/* Income Metrics */}
          <div className="rounded-lg bg-bo-success-light/50 p-4 border border-bo-success/15">
            <div className="text-sm font-medium text-bo-neutral-700 mb-3">Income Profile</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-bo-neutral-600 mb-1">Median Household</div>
                <div className="text-lg font-bold text-bo-success-dark">
                  {formatCurrency(primaryZone.income.medianHouseholdIncome)}
                </div>
              </div>
              <div>
                <div className="text-xs text-bo-neutral-600 mb-1">Avg Disposable</div>
                <div className="text-lg font-bold text-bo-success-dark">
                  {formatCurrency(primaryZone.income.averageDisposableIncome)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-bo-success/15">
              <div className="text-xs text-bo-neutral-600">High Income (&gt;€60k)</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-bo-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bo-success-dark rounded-full transition-all duration-300"
                    style={{ width: `${primaryZone.income.highIncomeShare}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-bo-success-dark">
                  {primaryZone.income.highIncomeShare}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-bo-neutral-500 mt-3 pt-3 border-t border-bo-success/15">
              <Database className="h-3 w-3" />
              <span>Source: Statistics Finland Income Distribution 2023</span>
            </div>
          </div>

          {/* Employment */}
          <div className="rounded-lg bg-bo-info-light/50 p-4 border border-bo-info/15">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-bo-info-dark" />
              <div className="text-sm font-medium text-bo-neutral-700">Employment</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-bo-neutral-600">Employment Rate</div>
                <div className="text-xl font-bold text-bo-info-dark">
                  {primaryZone.employment.employmentRate}%
                </div>
              </div>
              <div>
                <div className="text-xs text-bo-neutral-600">Students</div>
                <div className="text-xl font-bold text-bo-info-dark">
                  {formatNumber(primaryZone.employment.students)}
                </div>
              </div>
            </div>
            <div className="text-xs text-bo-neutral-600">
              <strong>Top Sectors:</strong> {primaryZone.employment.topSectors.slice(0, 3).join(', ')}
            </div>
            <div className="flex items-center gap-1 text-xs text-bo-neutral-500 mt-3 pt-3 border-t border-bo-info/15">
              <Database className="h-3 w-3" />
              <span>Source: Statistics Finland Employment Statistics Q3 2024</span>
            </div>
          </div>
        </div>

        {/* Drive-Time Zones Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-bo-neutral-950 text-sm">All Catchment Zones</h4>
          <div className="space-y-2">
            {demographics.zones.map((zone) => (
              <div
                key={zone.driveTimeMinutes}
                className="rounded-lg bg-bo-glass-subtle p-3 border border-bo-neutral-200/30"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-bo-neutral-950">
                      {zone.driveTimeMinutes}-min drive
                    </div>
                    <div className="text-xs text-bo-neutral-600">
                      {zone.postalCodes.length} postal codes · {formatNumber(zone.population.households)} households
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-bo-primary-700">
                      {formatNumber(zone.population.total)}
                    </div>
                    <div className="text-xs text-bo-neutral-600">residents</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-bo-neutral-500 mt-3">
            <Database className="h-3 w-3" />
            <span>Source: Statistics Finland + OpenStreetMap drive-time analysis</span>
          </div>
        </div>

        {/* Household Statistics - Clickable Card */}
        <button
          onClick={() => setIsHouseholdModalOpen(true)}
          className="w-full rounded-lg bg-gradient-to-r from-bo-info-100/70 to-bo-accent-100/50 p-4 border-2 border-bo-info-300/40 hover:border-bo-info-400 transition-all duration-200 hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/80 group-hover:bg-white transition-colors">
                <Home className="h-5 w-5 text-bo-info-dark" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-bo-neutral-950 mb-0.5">
                  Detailed Household Statistics
                </div>
                <div className="text-xs text-bo-neutral-600">
                  View household size, ownership, and dwelling types by area
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <div className="text-lg font-bold text-bo-info-dark">
                  {formatNumber(householdData.summary.totalHouseholds)}
                </div>
                <div className="text-xs text-bo-neutral-600">households</div>
              </div>
              <ChevronRight className="h-5 w-5 text-bo-info-dark group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {/* Household Data Modal */}
      <HouseholdDataModal
        data={householdData}
        isOpen={isHouseholdModalOpen}
        onClose={() => setIsHouseholdModalOpen(false)}
      />
    </MallCard>
  );
}
