/**
 * Zone Breakdown Sidebar
 * Quick reference showing all drive-time zones with population counts
 */

import { MallCard } from './ui/MallCard';
import type { CatchmentDemographics } from '@/lib/types/transport';

interface ZoneBreakdownSidebarProps {
  demographics: CatchmentDemographics;
  selectedZone: number | null;
  onZoneSelect: (zoneIndex: number | null) => void;
}

export function ZoneBreakdownSidebar({
  demographics,
  selectedZone,
  onZoneSelect
}: ZoneBreakdownSidebarProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const zoneColors = {
    5: { color: '#10b981', bg: '#d1fae5', label: '5 min' },
    10: { color: '#3b82f6', bg: '#dbeafe', label: '10 min' },
    15: { color: '#f59e0b', bg: '#fef3c7', label: '15 min' },
    30: { color: '#ef4444', bg: '#fee2e2', label: '30 min' },
  };

  return (
    <MallCard variant="glass" className="h-full">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-bo-neutral-950 border-b border-bo-neutral-200 pb-3">
          Zone Breakdown
        </h3>

        <div className="space-y-2">
          {demographics.zones.map((zone, index) => {
            const zoneConfig = zoneColors[zone.driveTimeMinutes as keyof typeof zoneColors];
            const isSelected = selectedZone === index;

            return (
              <button
                key={index}
                onClick={() => onZoneSelect(isSelected ? null : index)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-bo-primary-400 bg-bo-primary-50 shadow-sm'
                    : 'border-bo-neutral-200 bg-white hover:border-bo-neutral-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: zoneConfig.color }}
                    />
                    <div>
                      <div className="text-sm font-semibold text-bo-neutral-950">
                        {zoneConfig.label}
                      </div>
                      <div className="text-xs text-bo-neutral-500">
                        {zone.postalCodes.length} postal codes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-bo-neutral-950">
                      {formatNumber(zone.population.total)}
                    </div>
                    <div className="text-xs text-bo-neutral-500">residents</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-bo-neutral-200">
          <div className="text-xs text-bo-neutral-500 leading-relaxed">
            Click a zone to view detailed demographics and statistics
          </div>
        </div>
      </div>
    </MallCard>
  );
}
