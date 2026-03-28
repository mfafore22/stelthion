/**
 * Quick Stats Sidebar
 * Compact overview panel showing key catchment metrics
 */

import { useTranslation } from 'react-i18next';
import { MallCard } from './ui/MallCard';
import { Users, TrendingUp, MapPin, Briefcase } from 'lucide-react';
import type { CatchmentDemographics } from '@/lib/types/transport';

interface QuickStatsSidebarProps {
  demographics: CatchmentDemographics;
}

export function QuickStatsSidebar({ demographics }: QuickStatsSidebarProps) {
  const { t } = useTranslation('mall');
  const totalPopulation = demographics.zones.reduce((sum, zone) => sum + zone.population.total, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const stats = [
    {
      icon: Users,
      label: 'Total Catchment',
      value: formatNumber(totalPopulation),
      subtext: 'residents',
      color: 'text-bo-primary-600',
      bgColor: 'bg-bo-primary-50',
    },
    {
      icon: TrendingUp,
      label: 'Spending Potential',
      value: `${demographics.spendingPotential}/100`,
      subtext: 'high purchasing power',
      color: 'text-bo-success-dark',
      bgColor: 'bg-bo-success-light',
    },
    {
      icon: MapPin,
      label: 'Catchment Zones',
      value: demographics.zones.length.toString(),
      subtext: 'drive-time areas',
      color: 'text-bo-info-dark',
      bgColor: 'bg-bo-info-light',
    },
    {
      icon: Briefcase,
      label: 'Primary Profile',
      value: demographics.primaryProfile
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      subtext: 'demographic segment',
      color: 'text-bo-accent-600',
      bgColor: 'bg-bo-accent-50',
    },
  ];

  return (
    <MallCard variant="glass" className="h-full">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-bo-neutral-950 border-b border-bo-neutral-200 pb-3">
          Quick Stats
        </h3>

        <div className="space-y-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-bo-neutral-50 border border-bo-neutral-100"
              >
                <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-bo-neutral-600 mb-0.5">{stat.label}</div>
                  <div className="text-lg font-bold text-bo-neutral-950 leading-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs text-bo-neutral-500 leading-tight">{stat.subtext}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data Source Attribution */}
        <div className="pt-4 border-t border-bo-neutral-200">
          <p className="text-xs text-bo-neutral-500 leading-relaxed">
            {t('demographics.sourceAttribution', 'Demographics data: Statistics Finland (Tilastokeskus)')}
          </p>
        </div>
      </div>
    </MallCard>
  );
}
