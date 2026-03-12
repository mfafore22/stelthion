/**
 * Parking Status KPI Component
 * Displays real-time parking availability and utilization metrics
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MallCard } from './ui/MallCard';
import { Car, ParkingSquare, Zap, Euro, TrendingUp } from 'lucide-react';
import type { ParkingData } from '@/lib/types/transport';
import { VacancyGradientBar } from '@/components/ui/VacancyGradientBar';

interface ParkingStatusKPIProps {
  parkingData: ParkingData;
}

export function ParkingStatusKPI({ parkingData }: ParkingStatusKPIProps) {
  const { t } = useTranslation('mall');
  // Calculate total occupied and available
  const totalOccupied = parkingData.levels.reduce((sum, level) => sum + level.currentOccupancy, 0);
  const totalAvailable = parkingData.totalCapacity - totalOccupied;
  const utilizationPercent = (totalOccupied / parkingData.totalCapacity) * 100;

  // Color based on utilization
  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-bo-error-dark';
    if (percent >= 70) return 'text-bo-warning-dark';
    return 'text-bo-success-dark';
  };

  const getUtilizationBg = (percent: number) => {
    if (percent >= 90) return 'bg-bo-error-light/70 border-bo-error/15';
    if (percent >= 70) return 'bg-bo-warning-light/70 border-bo-warning/15';
    return 'bg-bo-success-light/70 border-bo-success/15';
  };

  const getUtilizationBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-bo-error-dark';
    if (percent >= 70) return 'bg-bo-warning-dark';
    return 'bg-bo-success-dark';
  };

  // Level-specific utilization
  const getLevelUtilization = (level: typeof parkingData.levels[0]) => {
    return (level.currentOccupancy / level.capacity) * 100;
  };

  // Total EV charging spots
  const totalEVSpots = parkingData.levels.reduce((sum, level) => sum + level.evChargingSpots, 0);

  return (
    <MallCard variant="glass">
      <div className="space-y-6">
        {/* Header with Overall Utilization */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-bo-neutral-950 mb-1 tracking-tight">
              {t('parking.status')}
            </h3>
            <p className="text-sm text-bo-neutral-600">
              {t('parking.outdoorSurfaceLotFree', { count: parkingData.totalCapacity })}
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${getUtilizationBg(utilizationPercent)}`}>
            <div className="flex items-center gap-2 mb-2">
              <ParkingSquare className={`h-5 w-5 ${getUtilizationColor(utilizationPercent)}`} />
              <div>
                <div className={`text-2xl font-bold ${getUtilizationColor(utilizationPercent)}`}>
                  {utilizationPercent.toFixed(0)}%
                </div>
                <div className="text-xs text-bo-neutral-600">{t('parking.full')}</div>
              </div>
            </div>
            <VacancyGradientBar percentage={utilizationPercent} height="5px" />
          </div>
        </div>

        {/* Available Spaces */}
        <div className="rounded-lg bg-bo-primary-50/50 p-4 border border-bo-primary-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-5 w-5 text-bo-primary-600" />
            <span className="text-sm font-medium text-bo-neutral-600">{t('parking.availableNow')}</span>
          </div>
          <div className="text-3xl font-bold text-bo-primary-700">
            {totalAvailable.toLocaleString()}
          </div>
          <div className="text-xs text-bo-neutral-600 mt-1 mb-3">
            {t('parking.occupiedPublic', { occupied: totalOccupied.toLocaleString(), public: parkingData.publicSpaces.toLocaleString() })}
          </div>
          <VacancyGradientBar percentage={utilizationPercent} height="5px" />
        </div>

        {/* Parking Levels Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-bo-neutral-950 text-sm">{t('parking.availabilityByZone')}</h4>
          <div className="space-y-2">
            {parkingData.levels.map((level) => {
              const available = level.capacity - level.currentOccupancy;
              const utilization = getLevelUtilization(level);

              return (
                <div
                  key={level.id}
                  className="rounded-lg bg-bo-glass-subtle p-3 border border-bo-neutral-200/30"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-bo-neutral-950">{level.id}</div>
                      {level.evChargingSpots > 0 && (
                        <Zap className="h-3 w-3 text-bo-warning-dark" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-bo-primary-700">
                        {available} <span className="text-xs text-bo-neutral-600">{t('parking.spacesAvailable')}</span>
                      </div>
                    </div>
                  </div>
                  <VacancyGradientBar percentage={utilization} height="8px" className="mb-1" />
                  <div className="flex justify-between text-xs text-bo-neutral-600">
                    <span>{level.currentOccupancy} / {level.capacity}</span>
                    <span>{t('parking.percentUtilized', { percent: utilization.toFixed(0) })}</span>
                  </div>
                  {level.id === 'P5' && (
                    <div className="mt-2 text-xs text-bo-neutral-600 italic">
                      * Designated for tower residents + mall personnel
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* EV Charging & Monthly Contracts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-bo-warning-light/50 p-3 border border-bo-warning/15">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-bo-warning-dark" />
              <span className="text-xs font-medium text-bo-neutral-600">{t('parking.evCharging')}</span>
            </div>
            <div className="text-xl font-bold text-bo-warning-dark">{totalEVSpots}</div>
            <div className="text-xs text-bo-neutral-600">{t('parking.chargingPoints')}</div>
          </div>
          <div className="rounded-lg bg-bo-accent-100/50 p-3 border border-bo-accent-300/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-bo-accent-700" />
              <span className="text-xs font-medium text-bo-neutral-600">{t('parking.monthly')}</span>
            </div>
            <div className="text-xl font-bold text-bo-accent-700">
              {parkingData.levels.reduce((sum, l) => sum + l.monthlyContracts, 0)}
            </div>
            <div className="text-xs text-bo-neutral-600">{t('parking.monthlySpaces')}</div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="rounded-lg bg-bo-info-light/50 p-4 border border-bo-info/15">
          <div className="flex items-center gap-2 mb-3">
            <Euro className="h-4 w-4 text-bo-info-dark" />
            <span className="text-sm font-medium text-bo-neutral-700">{t('parking.pricingHeader')}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-bo-neutral-600">{t('parking.hourly')}</div>
              <div className="text-lg font-bold text-bo-info-dark">
                €{parkingData.pricing.hourlyRate.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600">{t('parking.dailyMax')}</div>
              <div className="text-lg font-bold text-bo-info-dark">
                €{parkingData.pricing.dailyMax.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-bo-neutral-600">{t('parking.monthly')}</div>
              <div className="text-lg font-bold text-bo-info-dark">
                €{parkingData.pricing.monthlyContract}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-bo-neutral-600">
            {t('parking.paymentInfo')}
          </div>
        </div>

        {/* Visitor Transport Mode */}
        <div className="rounded-lg bg-bo-glass-subtle p-4 border border-bo-neutral-200/30">
          <div className="text-sm font-medium text-bo-neutral-700 mb-3">{t('parking.visitorArrivalModes')}</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-bo-neutral-600">{t('parking.car')}</span>
                <span className="text-xs font-medium text-bo-neutral-950">
                  {parkingData.carArrivalShare}%
                </span>
              </div>
              <div className="h-1.5 bg-bo-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bo-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${parkingData.carArrivalShare}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-bo-neutral-600">{t('parking.publicTransitWalking')}</span>
                <span className="text-xs font-medium text-bo-neutral-950">
                  {100 - parkingData.carArrivalShare}%
                </span>
              </div>
              <div className="h-1.5 bg-bo-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bo-success-dark rounded-full transition-all duration-300"
                  style={{ width: `${100 - parkingData.carArrivalShare}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MallCard>
  );
}
